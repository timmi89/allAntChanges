;(function(){
//dont bother indenting this top level anonymous function

var ANT = {};
if(window.ANTENNAIS && window.ANTENNAIS.hasLoaded){
    // reinit custom display hashes only
    window.ANTENNAIS.actions.reInit();
    return;
}

//ANTENNAIS and antenna will now be the only things in the global namespace
window.ANTENNAIS = window.antenna = ANT;

ANT.hasLoaded = true;

/*some constants that we need for now*/
ANT.C = {
    /*tied to div.ant div.ant_tag height*/
    // summaryWidgetMaxHeight: 68,
     //+ header height + extra padding;
    aWindowHeaderPadding: 29,
    aWindowWidthForKindIsText: 200,
    aWindowAnimationSpeed: 333,
    indicatorOpacity: 0.4,
    helperIndicators: {
        hoverDelay: 250,
        fadeInTime: 300,
        opacity: 0.6
    }
}

ANT.engageScript = document.getElementById("antennascript") || findEngageScript();
ANT.engageScriptSrc = ANT.engageScript.src;

//todo: clean these up
var $ANT, //our global $ANT object (jquerified ANT object for attaching data and queues and such)
$A, //init var: our clone of jQuery
ANT_scriptPaths = {},
//check if this script is the offline version
//note that the other ANT_offline vars in our iframes should check window.location for local.antenna.is instead
ANT_offline = !!(
    ANT.engageScriptSrc.indexOf('local-static.antenna.is') != -1 ||
    ANT.engageScriptSrc.indexOf('local.antenna.is') != -1 ||
    ANT.engageScriptSrc.indexOf('local.antenna2.is') != -1 ||
    document.domain == "local.antenna.is" //shouldn't need this line anymore
),
// ANT_baseUrl = ( ANT_offline ) ? window.location.protocol + "//local-static.antenna.is:8081":window.location.protocol + "//www.antenna.is",
// ANT_staticUrl = ( ANT_offline ) ? window.location.protocol + "//local-static.antenna.is:8081/static/":window.location.protocol + "//s3.amazonaws.com/readrboard/",
// ANT_widgetCssStaticUrl = ( ANT_offline ) ? window.location.protocol + "//local-static.antenna.is:8081/static/":window.location.protocol + "//s3.amazonaws.com/readrboard/";

ANT_baseUrl = ( ANT_offline ) ? window.location.protocol + "//local.antenna.is:8081": window.location.protocol + "//www.antenna.is",
ANT_staticUrl = ( ANT_offline ) ? window.location.protocol + "//local.antenna.is:8081/static/":window.location.protocol + "//s3.amazonaws.com/readrboard/",
ANT_widgetCssStaticUrl = ( ANT_offline ) ? window.location.protocol + "//local.antenna.is:8081/static/":window.location.protocol + "//s3.amazonaws.com/readrboard/";

// fails on iPhone?
// var isTouchBrowser = (
//     ('ontouchstart' in window) || 
//     (window.DocumentTouch && document instanceof DocumentTouch)
// );

// works?
var isTouchBrowser = ( ("ontouchstart" in window || navigator.msMaxTouchPoints) && ((window.matchMedia("only screen and (max-width: 768px)")).matches) );
var isMobile = ( isTouchBrowser && ((window.matchMedia("only screen and (max-width: 480px)")).matches) );

// DEBUG
// var isTouchBrowser = true;

// fails
// var isTouchBrowser = ((typeof window.Touch === "object") || window.DocumentTouch && document instanceof DocumentTouch);

ANT.safeThrow = function(msg){
    //this will never actually throw in production (if !ANT_offline)
    //this is used for errors that aren't stopship, but are definitely wrong behavior.
    //set localDebug to true if you want to catch these while developing.
    var debugMode = false;

    if(ANT_offline && debugMode){
        // [porter]  changing to log so that acceptable, trivial bugs are not blockers, but do get logged
        console.log(msg);
        // throw msg;
    }
};

//temp for testing
function test_antenna_extend(){
    //for saftey
    if(!ANT_offline){
        return;
    }
    window.antenna_extend = {
        default_reactions: [
            "Love It",
            "Hate It",
            "Heeeeeey"
        ]
    };
    window.antenna_extend_per_container = {
        "question1": {
            default_reactions: [
                "tag1",
                "tag2",
                "tag3"
            ]
        },
        "question2": {
            default_reactions: [
                "tag3",
                "tag4",
                "tag5",
                "tag6"
            ]
        }
    };
}
//keep this commented out when not testing.
// test_antenna_extend();

//this doesn't need to run if we have an id on the script
function findEngageScript(){
    var scripts = document.getElementsByTagName('script')

    for(var i=0; i<scripts.length; i++){
        var s = scripts[i];
        var src = s.src;
        //not looking for antenna.is right now in case we use the amazon version without an id on the script
        var isAntennaScript = (
            (src.indexOf('antenna') != -1 || src.indexOf('local-static.antenna.is') != -1 || src.indexOf('readrboard') != -1) &&
            src.indexOf('engage') != -1
        );
        if(isAntennaScript){
            return s;
        }
    }
}

function antenna($A){
    var $ = $A;

    $.extend(ANT, {
        summaries:{},
        current: {}, 
        // used to store jQuery deffered objects for assets that should be loaded only once per page load.
        assetLoaders: {
            content_nodes:{
            }
        },
        content_nodes: {
            //template: keep commented out
            /*
            body:"",
            location: <range>
            */
        },
        containers:{},
        pages:{},
        group: {
            //ANT.group:
            //details to be set by ANT.actions.initGroupData which extends defaults
            defaults: {
                premium: false,
                img_selector: "img",
                img_container_selectors:"#primary-photo",
                active_sections: "body",
                anno_whitelist: "body p",
                active_sections_with_anno_whitelist:"",
                media_selector: "embed, video, iframe",
                comment_length: 500,
                /*this is basically not used right now*/
                initial_pin_limit: 3,
                no_ant: "",
                img_blacklist: "",
                custom_css: "",
                // call_to_action: ANT.t('main_cta'),
                //todo: temp inline_indicator defaults to make them show up on all media - remove this later.
                inline_selector: 'img, embed, video, iframe',
                paragraph_helper: true,
                media_url_ignore_query: true,
                summary_widget_method: 'after',
                language: 'en',
                ab_test_impact: true,
                ab_test_sample_percentage: 10,
                img_indicator_show_onload: true,
                img_indicator_show_side: 'left',
                tag_box_bg_colors: 'background:rgba(0,0,0,0.25);',
                tag_box_bg_colors_hover: 'background:rgba(0,0,0,0.1);',
                tag_box_font_family: 'HelveticaNeue,Helvetica,Arial,sans-serif',

                // tags_bg_css: 'linear-gradient(rgba(52, 133, 169, 0.95),rgba(112, 177, 204, 0.95))',  // blue transparent-y

                tags_bg_css: 'background-image: linear-gradient(185deg,#333,#777);', // black-white

                // tags_bg_css: 'background:#e0e0e0;', // mostly white
                // tags_bg_css: 'background-image: linear-gradient(185deg,#aaa,#fff);', // mostly white

                tag_box_text_colors: 'color:#fff;',

                ignore_subdomain: false,
                //the scope in which to find parents of <br> tags.  
                //Those parents will be converted to a <rt> block, so there won't be nested <p> blocks.
                //then it will split the parent's html on <br> tags and wrap the sections in <p> tags.

                summary_widget_expanded_mobile: false,
                separate_cta_expanded: "none",  // "none","desktop","mobile","both"
                
                //example:
                // br_replace_scope_selector: ".ant_br_replace" //e.g. "#mainsection" or "p"
                
                br_replace_scope_selector: null //e.g. "#mainsection" or "p"
            }
        },
        user: {
            img_url: "",
            ant_token: "",
            user_id: ""
        },
        known_users: {

        },
        errors: {
            actionbar: {
                rating:"",
                commenting:""
            }
        },
        styles: {
        },
        events: {
            focusedSeconds:0,
            fireScrollEvent: function(milestone) {
                if (milestone.indexOf('more') != -1) {
                    var event_type = 'scroll_more';
                } else {
                    var event_type = 'sc';
                }
                ANT.events.trackEventToCloud({
                    event_type: event_type,
                    event_value: milestone
                });

            },
            fireEventQueue: function() {
                $.each( ANT.events.queue, function(idx, event_params) {
                    ANT.events.trackEventToCloud(event_params);
                });
            },
            // checkTime: function() {
                // if ( document.hasFocus() === true ){
                //     if ( ANT.events.focusedSeconds > 0 && ANT.events.focusedSeconds % 20 == 0 ) {  // && ANT.events.justFocused === false 
                //         ANT.events.trackEventToCloud({
                //             event_type: 'ti',
                //             event_value: ANT.events.focusedSeconds.toString()
                //         });
                //     }
                //     ANT.events.focusedSeconds++;
                    // if (ANT.events.justFocused === false ) {
                    //     ANT.events.focusedSeconds++;
                    // } else {
                    //     ANT.events.justFocused = false;
                    // }
                // }
            // },
            // track : function( data, hash ) {
                // ANT.events.track:
                
                // var standardData = "",
                //     timestamp = new Date().getTime();
                
                // ANT.user = ANT.user || {};
                
                // if ( ANT.user && ANT.user.user_id ) standardData += "||uid::"+ANT.user.user_id;
                // if ( hash && ANT.util.getPageProperty('id', hash) ) standardData += "||pid::"+ANT.util.getPageProperty('id', hash);
                // if ( ANT.group && ANT.group.id ) standardData += "||gid::"+ANT.group.id;
                // if ( ANT.engageScriptParams.bookmarklet ) standardData += "||bookmarklet";

                // var eventSrc = data+standardData,
                //     $event = $('<img src="'+ANT_baseUrl+'/static/widget/images/event.png?'+timestamp+'&'+eventSrc+'" />'); // NOT using STATIC_URL b/c we need the request in our server logs, and not on S3's logs

                // $('#ant_event_pixels').append($event);

            // },
            trackEventToCloud: function( params ) {
                // ANT.events.trackEventToCloud
                ANT.user = ANT.user || {};
                ANT.events.queue = ANT.events.queue || [];

                // this puts in some checks to be able to track event if event_type == 'sl', i.e., script load
                // which will not have all of the PAGE data loaded yet.
                if ( (ANT.events.recordEvents || params.event_type == 'sl') && typeof params.event_type !== 'undefined' && params.event_value !== 'undefined'){
                    var page_id = (params.event_type == 'sl') ? 'na' : parseInt( ( (typeof params.page_id != 'undefined') ? params.page_id : ANT.util.getPageProperty('id') ).toString() );
                    var referrer_url_array = document.referrer.split('/');
                    var referrer_url = referrer_url_array.splice(2).join('/');

                    var HOSTDOMAIN = /[-\w]+\.(?:[-\w]+\.xn--[-\w]+|[-\w]{2,}|[-\w]+\.[-\w]{2})$/i;
                    var referrer_domain = referrer_url.split('/').splice(0,1).join('/').split(':')[0]; // get domain, strip port
                    var referrer_tld = (referrer_domain) ? HOSTDOMAIN.exec( referrer_domain )[0] : '';

                    // if (params.event_type == 'widget_load') {
                        var trackData = {
                            /*

                            et : event_type
                            ev : event_value
                            gid : group_id
                            uid : user_id
                            pid : page_id
                            lts : long_term_session
                            sts : short_term_session
                            ref : referrer_url    // referrer_tld
                            cid : content_id
                            ah : article_height
                            ch : container_hash
                            ck : container_kind
                            r : reaction_body
                            pt : page_title
                            cu : canonical_url
                            pu : page_url
                            ru : referrer_url
                            ca : content_attributes
                            cl : content_location
                            ptop : page_topics
                            a : author
                            sec : site_section
                            it : isTouchBrowser
                            sw : screen_width
                            sh : screen_height
                            pd : pixel_density
                            ua : user_agent

                            */
                            // for all events
                            et: params.event_type,
                            ev: params.event_value,
                            gid: ANT.group.id || null,
                            uid: ANT.user.user_id || null,
                            pid: page_id,
                            lts: ANT.user.lts || null,
                            sts: ANT.user.sts || null,
                            ref: referrer_url || null,
                            cid: params.content_id || null,
                            ah: (params.event_type == 'sl') ? 'na' : parseInt(ANT.group.active_section_milestones[100]) || null,
                            ch: params.container_hash || null,
                            ck: params.container_kind || null,
                            r: params.reaction_body || null,
                            pt: ANT.util.getPageProperty('title') || null,
                            cu: ANT.util.getPageProperty('canonical_url') || null,
                            pu: ANT.util.getPageProperty('page_url') || null,
                            ru: referrer_url || null,
                            ca: params.content_attributes || null,  // what is this for?
                            cl: params.content_location || null,  
                            ptop: ANT.group.topics || null,
                            a: ANT.group.author || null,
                            sec: ANT.group.section || null,
                            it: isTouchBrowser || false,
                            sw:  screen.width,
                            sh:  screen.height,
                            pd:  window.devicePixelRatio || Math.round(window.screen.availWidth / document.documentElement.clientWidth),
                            ua:  navigator.userAgent

                            /*
                            value abbreviations
                            event_type
                              share         :     sh
                              summary bar   :     sb
                              aWindow_show   :     rs
                              scroll        :     sc
                              widget_load   :     wl
                              comment       :     c
                              reaction      :     re
                              time          :     t

                            event_value
                              view content    :   vc
                              view comments   :   vcom
                              view reactions  :   vr
                              writemode       :   wr
                              readmode        :   rd

                              default summary bar   :   def
                              single summary bar    :   si
                              multiple pages        :   mu
                              unexpected            :   unex
                            */
                        };
                    var data = $.toJSON( trackData );

                    // NO LONGER USER XDM FRAME FOR EVENT RECORDING.  WTF PORTER.  :)
                    var trackingUrl = "http://nodebq.docker:3000/insert";
                    if (document.domain != "local.antenna.is") {
                        var percentGKETraffic = 101;
                        trackingUrl = (Math.random() * 100 < percentGKETraffic) ? "http://events.antenna.is/insert" : "http://events.readrboard.com/insert";
                    }

                    $.ajax({
                        url: trackingUrl,
                        type: "get",
                        contentType: "application/json",
                        dataType: "jsonp",
                        data: {
                            json: data
                        },
                        success : function(response)
                        {
                        }
                    });

                }
            },
            emit: function(eventName, eventValue, eventSupplementary) {
                // ANT.events.emit
                // if (ANT.group.premium == true) {
                    // non-IE
                    ANT.events.lastEvent = eventName;
                    ANT.events.lastValue = eventValue;
                    ANT.events.lastSupplementary = eventSupplementary;

                    if (document.createEvent) {
                        evt = document.createEvent("Event");
                        evt.initEvent(eventName, true, true);
                        document.dispatchEvent(evt);
                    } else if (document.createEventObject) { // MSIE
                        // just change the property 
                        // this will trigger onpropertychange
                        document.documentElement[eventName]++;
                    };
                // }
            }
        },
        groupSettings: {
            getCustomSettings: function(){
                //ANT.groupSettings.getCustomSettings:

                // grab anything on the page
                var group_extensions = window.antenna_extend || {};

                // handle deprecated "blessed_tags"
                if ( typeof group_extensions.blessed_tags != 'undefined' ) {
                    // use .slice() to copy by value
                    // http://stackoverflow.com/questions/7486085/copying-array-by-value-in-javascript
                    group_extensions.default_reactions = group_extensions.blessed_tags.slice();
                    delete group_extensions.blessed_tags;
                }

                // handle deprecated "no_readr", now called no_ant
                if ( typeof group_extensions.no_readr != 'undefined' ) {
                    // use .slice() to copy by value
                    // http://stackoverflow.com/questions/7486085/copying-array-by-value-in-javascript
                    group_extensions.no_ant = group_extensions.no_readr;
                    delete group_extensions.no_readr;
                }

                // grab anything from the URL
                // example usage:  ant_hideOnMobile=false&ant_doubleTapMessage=%27hello%20world%27
                var qs = ANT.util.getQueryParams(),
                    group_qs_extensions = {};

                $.each(qs, function(key, val){
                    if ( key.indexOf('ant_') === 0 ) {
                        key = key.substr(4);
                        group_qs_extensions[key] = val;
                    }
                });       

                group_extensions = $.extend({}, group_extensions, group_qs_extensions );

                //the translations just make for a nicer api.  If no translation is defined for a setting, it returns the given value.
                return ANT.groupSettings._translate(group_extensions);
            },
            translators: {
                default_reactions: function(tagsList){
                    // because our API returns this in the form  "blessed_tags": [{ "body": "Love It",  "id": 368}...] 
                    // modified to reference 'default_reactions' instead of 'blessed_tags'
                    return $.map(tagsList, function(val, idx){
                        return {body: val, 'is_default':true};
                    });
                }
            },
            _translate: function(settings){
                //ANT.groupSettings._translate:
                var ret_settings = {};
                var translators = ANT.groupSettings.translators;
                $.each(settings, function(key, val){
                    ret_settings[key] = !!translators[key] ? translators[key](val) : val;
                });

                return ret_settings;
            },
            getBlessedTags: function(hash){
                //ANT.groupSettings.getBlessedTags:

                // return blessed tags for this hash, if they exist...
                var perContainerSettings = window.antenna_extend_per_container;
                if(hash && perContainerSettings){
                    var name = getCustomANTItems(hash);
                    var perContainerExtentions = perContainerSettings[name];

                    // handle deprecated "blessed_tags"
                    // if ( typeof perContainerExtentions.blessed_tags != 'undefined' ) {
                    if (perContainerExtentions && perContainerExtentions.blessed_tags) {
                        // use .slice() to copy by value
                        // http://stackoverflow.com/questions/7486085/copying-array-by-value-in-javascript
                        perContainerExtentions.default_reactions = perContainerExtentions.blessed_tags.slice();
                        delete perContainerExtentions.blessed_tags;
                    }

                    if(perContainerExtentions && perContainerExtentions.default_reactions){
                        var settings = ANT.groupSettings._translate(perContainerExtentions);
                        return settings.default_reactions;
                    }
                }

                function getCustomANTItems(hash){
                    var $el = $('[ant-hash="' + hash + '"]');
                    var name = $el.attr('ant-item');
                    return name;
                }

                // otherwise, return the reactions that are set on the page
                // via Admin or via window.antenna_extend object
                return ANT.group.default_reactions;
            }
        },
        aWindow: {
            defaults:{
                coords:{
                    left:100,
                    top:100
                },
                // pnlWidth:170,
                animTime:100,
                defaultHeight:260,
                minHeight: 10,
                maxHeight: 300,
                minWidth: 125,
                maxWidth: 600,
                forceHeight: false,
                rewritable: true
            },
            makeHeader: function( _headerText, interactionId ) {
                //ANT.aWindow.makeHeader:
                var headerText = _headerText || "";

                var headerHtml = $.mustache(
                    '<div class="ant ant_header">'+
                        // '<div class="ant_header_arrow">'+
                            // '<img src="{{ANT_staticUrl}}widget/images/header_up_arrow.png" />'+
                        // '</div>'+
                        '<div class="ant_close">X</div>'+
                        '<div class="ant_loader"></div>'+
                        // '<div class="ant_about"><a href="http://www.antenna.is/" target="_blank">&nbsp;</a></div>'+
                        '<div class="ant_indicator_stats">'+
                            '<span class="ant-antenna-logo"></span>'+
                            '<span class="ant_count"></span>'+
                        '</div>' +
                        '<h1>{{headerText}}</h1>'+
                    '</div>'
                ,{
                    ANT_staticUrl: ANT_staticUrl,
                    headerText: headerText
                });

                var $header = $(headerHtml);
                $header.find('.ant_close').on('touchend.ant', function(e) {
                    if (e) e.preventDefault();
                    ANT.actions.UIClearState();
                    if ( ANT.util.isTouchDragging(e) ) { return; }
                });

                if(!interactionId){
                    return $header;
                }

               
                var $menuDropdownActions = $(
                    '<div class="ant_menuDropDown ant_menu_actions">'+
                        '<span class="ant-chevron-down ant_menuTrigger"></span>'+
                    '</div>'
                );
                var $menuActions = makeActionList();
                $menuDropdownActions.append($menuActions);

                var $menu = $('<div class="ant_aWindowMenu"></div>').append($menuDropdownActions);

                // $menu.append($menuActions);
                if(isTouchBrowser){
                    $menu.on('touchend.ant', '.ant_menuDropDown', function(e){
                        // if (ANT.util.bubblingEvents['dragging'] == true ) { return; }
                        if ( ANT.util.isTouchDragging(e) ) { return; }
                        $(this).toggleClass('ant_hover');
                    });
                }

                $header.append($menu);
    
                function makeActionList(){
                    var $links = $(
                        '<div class="ant_linkWrap">'+
                            '<ul>'+
                                // '<li class="ant_link">'+
                                    // '<a href="javascript:void(0);" class="ant_undo_link">'+ANT.t('remove_reaction')+'</a>'+
                                // '</li>'+
                                '<li class="ant_link">'+
                                    '<a target="_blank" href="'+ANT_baseUrl+'/interaction/'+interactionId+'" class="ant_seeit_link">'+ANT.t('view_on_site')+'</a>'+
                                '</li>'+
                            '</ul>'+
                        '</div>'
                    );
                    return $links;
                }

                return $header;
            },
            makeDefaultPanelMessage: function( $aWindow, _kind ) {
                //ANT.aWindow.makeDefaultPanelMessage:

                var hash = $aWindow.data('hash');
                var summary = ANT.summaries[hash];
                var kind = _kind || (
                    $aWindow.hasClass('ant_indicator_details') ?
                    "media" :
                    "text"
                );

                var headerText;

                if( kind == "text" ){
                    if ( $aWindow.data('mode') == "writeMode" ) {
                        headerText = ANT.t('main_cta');
                    } else {
                        if (kind=="text") {
                            headerText = ANT.t('reactions');
                        } else {
                            headerText = (summary.counts.tags>0) ? summary.counts.tags + ANT.t('reactions') : ANT.t('reactions');
                        }
                    }

                }else{
                    //note: $aWindow is the $indicator_details

                    //confirm if we still need this.
                    var modForIE = ( $.browser.msie && parseInt( $.browser.version, 10 ) < 9 ) ? 20:0;
                    headerText = (summary.counts.tags>0) ? 
                            summary.counts.tags + " " + ANT.t('reactions') :
                            ($aWindow.width()>=(175+modForIE)) ? 
                                ANT.t('main_cta'):
                                ANT.t('react')+":";
                }

                return headerText;
            },
            updateFooter: function( $aWindow, $content ) {
                //ANT.aWindow.updateFooter:
                var $footer = $aWindow.find('div.ant_footer');
                $footer.show(0);
                if ( typeof $content != "undefined" ) $footer.html( $content + '<a class="antenna-logo-link" target="_blank" href="'+ window.location.protocol + '//www.antenna.is/">Antenna</a>' );
                
                //todo: examine resize
                // ANT.aWindow.updateSizes( $aWindow );
            },
            hideFooter: function( $aWindow ) {
                //ANT.aWindow.hideFooter:
                $aWindow.find('div.ant_footer').hide(0);
                
                //todo: examine resize
                // ANT.aWindow.updateSizes( $aWindow );
            },
            panelCreate: function( $aWindow, className ) {
                //ANT.aWindow.panelCreate
                // later, I want to add the ability for this to create an absolutely-positioned panel
                // that will slide OVER, not next to, current content... like a login panel sliding over the content.

                // create a new panel for the aWindow
                if ( !$aWindow ) return;

                var $ant_body_wrap = $aWindow.find('div.ant_body_wrap'),
                    $ant_bodyFirst = $ant_body_wrap.find('div.ant_body').eq(0);

                //not sure if this will ever happen - could just be legacy stuff
                var $existingPanel = $ant_body_wrap.find('div.'+className);
                $existingPanel.remove();

                var $newPanel = $('<div class="ant_body '+className+'"/>'),
                        column_count = ( $ant_body_wrap.find('div.ant_body').length ) + 1;
        
                return $newPanel;
            },
            panelUpdate: function( $aWindow, className, $newPanel, shouldAppendNotReplace ) {
                //ANT.aWindow.panelUpdate:
                if ( !$aWindow ) return;
                var $ant_body_wrap = $aWindow.find('div.ant_body_wrap'),
                    $panel = $ant_body_wrap.find('div.'+className);

                if (shouldAppendNotReplace || !$panel.length){
                    $panel.append( $newPanel );
                }else{
                    // replacewith bug
                    $panel.replaceWith( $newPanel );
                }
                return $newPanel;
            },

            panelShow: function( $aWindow, $showPanel, callback ) {
                //ANT.aWindow.panelShow: 
                // panelEvent - panelShow

                var $panelWrap = $aWindow.find('.ant_body_wrap');
                var $hidePanel = $aWindow.find('.ant_visiblePanel');
                //do this for now, because there are too many places in the code to add this correctly
                if(!$hidePanel.length){
                    $hidePanel = $aWindow.find('.ant_body').eq(0);
                }

                var animWidth = $hidePanel.width();

                // reflow opportunity
                $showPanel
                    .show()
                    .addClass('ant-visible')
                    .css({
                        position: 'relative',
                        top: 0,
                        left: animWidth
                    });

                ANT.util.stayInWindow( $aWindow, true );
                $aWindow.data('panelState', 2);
                $showPanel.addClass('ant_visiblePanel').removeClass('ant_hiddenPanel');
                $hidePanel.addClass('ant_hiddenPanel').removeClass('ant_visiblePanel');

                //update the size at the same time so the animations run in parallel
                ANT.aWindow.updateSizes( $aWindow );
                $panelWrap.animate({
                      left: -animWidth
                  },
                  ANT.C.aWindowAnimationSpeed,
                  function() {
                      if (callback) callback();
                      if ( $aWindow.data('jsp') ) {
                          var API = $aWindow.data('jsp');
                          // why can't i make this use the WIDTH that is already set?  it keeps resizing the jscrollpane to will the space
                          API.reinitialise();
                      } else {
                          $aWindow.jScrollPane({ showArrows:true,contentWidth: '0px' });
                      }
                  }
                );
            },
            panelHide: function( $aWindow, callback ) {
                //ANT.aWindow.panelHide:
                
                // panelEvent - panelhide
                var $panelWrap = $aWindow.find('.ant_body_wrap');

                var isWriteMode = $aWindow.hasClass('ant_writemode'),
                    $tagsListContainer = ANT.actions.indicators.utils.makeTagsListForInline( $aWindow, isWriteMode );
                
                var className = "ant_tags_list";
                var $hidePanel = $aWindow.find('.ant_visiblePanel');
                $hidePanel.removeClass('ant_visiblePanel').addClass('ant_hiddenPanel');

                // replacewith bug
                // var $showPanel = ANT.aWindow.panelUpdate($aWindow, className, $tagsListContainer );
                // $showPanel.addClass('ant_visiblePanel').removeClass('ant_hiddenPanel');
                $tagsListContainer.addClass('ant_visiblePanel').removeClass('ant_hiddenPanel');
                
                // var animWidth = $showPanel.width();
                var animWidth = $tagsListContainer.width();
                $hidePanel.css('left', animWidth);
                $panelWrap.css('left', -animWidth);

                //update the size at the same time so the animations run in parallel
                ANT.aWindow.updateSizes( $aWindow );
                $panelWrap.animate({
                    left: 0
                },
                ANT.C.aWindowAnimationSpeed,
                function() {
                    if (callback) callback();
                    $aWindow.data('panelState', 1);
                    
                    if ( $aWindow.data('jsp') ) {
                        var API = $aWindow.data('jsp');
                        // why can't i make this use the WIDTH that is already set?  it keeps resizing the jscrollpane to will the space
                        API.reinitialise();
                    } else {
                        $aWindow.jScrollPane({ showArrows:true,contentWidth: '0px' });
                    }

                });
            },
            //somewhat hacky function to reliably update the tags and ensure that the panel hide and show work
            updateTagPanel: function ( $aWindow ) {
                // ANT.aWindow.updateTagPanel:
                // panelEvent - backButton

                var hash = $aWindow.data('hash');

                ANT.aWindow.panelHide( $aWindow );
                ANT.aWindow.tagBox.setWidth( $aWindow, $aWindow.data('initialWidth') );
                ANT.aWindow.tagBox.setHeight( $aWindow, $aWindow.data('initialHeight') );

            },

            mediaAWindowShow: function ( $mediaItem ) {
                //ANT.aWindow.mediaAWindowShow
                var hash = $mediaItem.data('hash'),
                    $aWindow = $('#ant_indicator_details_'+hash);


                ANT.util.cssSuperImportant($aWindow, {
                    display:"block",
                });
                // check to see if the hover event has already occurred (.data('hover')
                // and whether either of the two elements that share this same hover event are currently hovered-over
                //not sure we need all this logic anymore
                if ( $mediaItem.data('hover') && !$aWindow.data('hover') && !$aWindow.is(':animated') && !$aWindow.closest('div.ant_media_details').length ) {
                    $aWindow.data('hover',true);
                    ANT.aWindow.updateSizes( $aWindow );
                }
                $aWindow.addClass('ant_engaged')
            },
            mediaAWindowHide: function ( $mediaItem ) {
                //ANT.aWindow.mediaAWindowHide:
                var hash = $mediaItem.data('hash'),
                    $aWindow = $('#ant_indicator_details_'+hash);

                if ( !$mediaItem.data('hover') && !$aWindow.is(':animated') && !$aWindow.closest('div.ant_media_details').length ) {
                    $aWindow.data('hover', false).animate( {'height':'0px' }, ANT.C.aWindowAnimationSpeed, function() {
                        // $aWindow.removeClass('ant_has_border');
                        ANT.util.cssSuperImportant($aWindow, {
                            display:"none",
                        });
                    });
                }
                $aWindow.removeClass('ant_engaged');
                $('#ant_indicator_' + hash).hide();
            },
            updateSizes: function($aWindow, _options) {
                //ANT.aWindow.updateSizes:
                // options are {
                //     setWidth,
                //     setHeight,
                //     noAnimate
                // }

                //_kind should not need to be set manually
                var kind = (
                    $aWindow.hasClass('ant_indicator_details') ?
                    "media" :
                    "text"
                );

                var options = _options || {};

                var $elm = $aWindow.find('.ant_visiblePanel');

                // var $jsPane = $elm.find('div.jspPane');
                var initialWidth = $aWindow.data('initialWidth'),
                    initialHeight = $aWindow.data('initialHeight');

                var width,
                    height;

                //fix this later.  We should be expanding only the body instead of the whole thing so we dont need this.
                //note - includes padding
                var aWindowHeaderHeight = 0;

                var defaults = {
                    h: 200,
                    w: 200,
                    duration: ANT.C.aWindowAnimationSpeed
                };

                // if(kind == "media"){
                //     defaults.w = containerWidth;
                // }else{
                // }
                defaults.w = $elm.width();
                defaults.h = $elm.height() + 32; // 32px is the header height

                width = options.setWidth || defaults.w;
                height = options.setHeight || defaults.h;

                if(options.noAnimate){
                    $aWindow.css({
                        width: width,
                        height: height
                    });
                }
                $aWindow.animate({
                    width: width,
                    height: height
                },{
                    duration: defaults.duration,
                    queue:false
                });

                ANT.aWindow.jspUpdate($aWindow);
            },
            updatePageTagMessage: function(args, action) {
                // if(action == 'tagDeleted'){
                //     var $aWindow = $('div.ant_window:eq(0)');
                //     ANT.aWindow.hideFooter($aWindow);
                //     $aWindow.find('.ant_header h1').text('Reaction Undone');
                //     $aWindow.find('.ant_body').css('height','auto').html(
                //         '<div class="ant_reactionMessage ant_reactUndoSuccess">'+
                //             '<div class="ant_label_icon"></div>'+
                //             '<em>'+
                //                 '<span>Your Reaction: </span>'+
                //                 '<strong> '+args.tag.body+' </strong>'+
                //                 '<span>has been undone.</span>'+
                //             '</em>'+
                //         '</div>' 
                //     );
                // }
            },
            updateTagMessage: function(args) {
                //ANT.aWindow.updateTagMessage
                // used for updating the message in the aWindow that follows a reaction
                if ( args.scenario && args.aWindow ) {
                    // ugly as hell.  rewrite time.
                    if ( args.args ) {
                        $.each( args.args, function( key, copyThisArg ) {
                            if (typeof copyThisArg == "object" ) {
                                args[key] = $.extend( true, {}, copyThisArg );
                            } else {
                                args[key] = copyThisArg;
                            }
                        });
                    }

                    var hash = args.hash,
                        $aWindow = args.aWindow,
                        kind = args.kind,
                        tag = args.tag,
                        summary = ANT.summaries[hash],
                        content_node = (args.sendData)?args.sendData.content_node_data:{};

                    ANT.aWindow.tagBox.setWidth( $aWindow, 222 );

                    if ( args.scenario != "tagDeleted" ) {
                        if ( args.scenario == "reactionSuccess" || args.scenario == "reactionExists" ) {

                                var $success = $('<div class="ant_view_success"></div>'),
                                    $subheader = $('<div class="ant_subheader ant_clearfix"></div>').appendTo( $success ),
                                    tagBody = ( tag.body ) ? tag.body:tag.tag_body,
                                    $h1 = $('<h1>'+tagBody+'</h1>').appendTo( $subheader ),
                                    $options = $('<div class="ant_nextActions"></div>').appendTo( $success );
                                
                                if ( args.kind != 'page' ) {
                                    var $sayMore = ANT.actions.comments.makeCommentBox({
                                        content_node: content_node,
                                        summary: summary,
                                        hash: hash,
                                        tag: tag,
                                        kind: kind,
                                        $aWindow: $aWindow,
                                        selState: content_node.selState || null
                                    }).appendTo( $options );
                                }

                                // if ( kind != "text" ) {
                                    var $backButton = $('<div class="ant_back">'+ANT.t('close')+' X</div>');
                                    $success.prepend($backButton);
                                    $backButton.click( function() {

                                        var doClose = ANT.aWindow.safeClose($aWindow);
                                        if(!doClose){
                                            return;
                                        }

                                        ANT.aWindow.updateTagPanel( $aWindow );

                                    });
                                // }

                                var shouldAppendNotReplace = true;
                                ANT.aWindow.panelUpdate( $aWindow, 'ant_view_more', $success, shouldAppendNotReplace);

                                ANT.user = ANT.user || {};
                                
                                var onAction = function(event){
                                    var args = event.data.args;

                                    // panelEvent - undo1

                                    var newArgs = {
                                        hash: args.hash,
                                        int_id: args.response.data.interaction.id,
                                        tag: args.tag,
                                        aWindow: $aWindow
                                    };

                                    ANT.actions.interactions.ajax( newArgs, 'react', 'remove' );

                                };

                                if(isTouchBrowser){
                                    $aWindow.find('a.ant_undo_link').on('touchend.ant', {args:args}, onAction);
                                }else{
                                    $aWindow.find('a.ant_undo_link').on('click.ant', {args:args}, onAction);
                                }

                            function makeShareLinks(){

                                var $shareLinks = $('<div class="ant_shareLinks"><div class="ant_share_cta">'+ANT.t('share_reaction')+':</div> <ul></ul></div>'),
                                // sns sharing links
                                socialNetworks = ["facebook","twitter"];  //, "tumblr"]; //,"tumblr","linkedin"];

                                // embed icons/links for diff SNS
                                $.each(socialNetworks, function(idx, val){
                                    var $link = $('<li><a href="http://' +val+ '.com" ><i class="ant-social-'+val+'"></i></a></li>');
                                    $shareLinks.find('ul').append($link);
                                    $link.click( function() {
                                        
                                        var tag_body = args.tag.tag_body || args.tag.body;
                                        // goddamnit this hack.
                                        if(args.hash.jquery){
                                            content_node.hash = "page";
                                            hash = args.hash = "page";
                                        }

                                        ANT.events.trackEventToCloud({
                                            event_type: "sh",
                                            event_value: val,
                                            container_hash: hash,
                                            container_kind: args.kind,
                                            page_id: args.page_id,
                                            reaction_body: tag_body
                                        });

                                        var summary = ANT.summaries[hash];
                                        //hack to get the kind
                                        var kind = args.kind || summary.kind;
                                        ANT.shareWindow = window.open(ANT_staticUrl+'share.html', 'ant_share','menubar=1,resizable=1,width=626,height=436');
                                        
                                        ANT.actions.share_getLink({
                                            referring_int_id:args.response.data.interaction.id,
                                            hash:args.hash,
                                            kind:kind,
                                            sns:val,
                                            aWindow:$aWindow,
                                            tag:tag,
                                            content_node:content_node
                                        }); // ugh, lots of weird data nesting
                                        return false;
                                    });
                                });
                                return $shareLinks;
                            }

                            // var $shareSocialWrap = $('.ant_menu_share .ant_linkWrap');
                            var $shareSocialWrap = $('.ant_nextActions');
                            $shareSocialWrap.append( makeShareLinks() );
                        }

                        ANT.actions.containers.media.onEngage( hash );
                    } else {
                        
                        var headerText = ANT.aWindow.makeDefaultPanelMessage($aWindow);
                        var $header = ANT.aWindow.makeHeader( headerText);
                        $aWindow.find('.ant_header').replaceWith($header);

                        $aWindow.removeClass('ant_viewing_more').find('div.ant_indicator_details_body').show();  // image specific.
                        ANT.aWindow.panelHide( $aWindow );
                        // ANT.aWindow.panelHide( $aWindow, 'ant_view_more', $aWindow.data('initialWidth'), null, function() {
                        //     $aWindow.find('table.ant-one-column td').triggerHandler('mousemove');
                        // });
                    }
                    
                    //todo: examine resize
                    ANT.aWindow.updateSizes( $aWindow );
                }
            },
            jspUpdate: function( $aWindow ) {
                //ANT.aWindow.jspUpdate:
                //updates or inits first (and should be only) $aWindow ant_body into jScrollPanes

                if ( !$aWindow.closest('.jspContainer').length && !$aWindow.hasClass('jspScrollable') ) {
                    $aWindow.find('div.ant_body').each( function() {
                        var $this = $(this);

                        if( !$this.hasClass('jspScrollable') ){
                            // IE.  for some reason, THIS fires the scrollend event.  WTF:
                            $(this).jScrollPane({ showArrows:true,contentWidth: '0px' });
                        }else{
                            var API = $(this).data('jsp');
                            API.reinitialise();
                        }
                    });
                }
            },
            tagBox: {
                setWidth: function( $aWindow, width ) {
                    // ANT.aWindow.tagBox.setWidth
                    // should probably just be ANT.aWindow.setWidth ??
                    // width must be 200, 300, or 400
                    var aWindowWidth = (ANT.group.max_aWindow_width) ? ANT.group.max_aWindow_width:width;
                    $aWindow.removeClass('w111 w222').addClass('w'+aWindowWidth);
                },
                setHeight: function( $aWindow, height ) {
                    // ANT.aWindow.tagBox.setHeight
                    // should probably just be ANT.aWindow.setWidth ??
                    // width must be 200, 300, or 400
                    $aWindow.find('.ant_body, .jspContainer').height( height );
                },
                make: function( params ) {
                    //ANT.aWindow.tagBox.make:
                    var tag = params.tag,
                        boxSize = ( params.boxSize ) ? params.boxSize : "medium", //default
                        $aWindow = ( params.$aWindow ) ? params.$aWindow : null,
                        $tagContainer = ( params.$tagContainer ) ? params.$tagContainer : ( params.$aWindow ) ? params.$aWindow.find('div.ant_body.ant_tags_list') : null,
                        reactionViewStyle = $aWindow.attr('ant-view-style') || 'grid',
                        tagCount = ( tag.tag_count ) ? tag.tag_count:"",
                        bgColorInt = ( params.bgColorInt ) ? params.bgColorInt:0,
                        rowNum = ( params.rowNum ) ? params.rowNum:0,
                        // textColorInt = ( params.textColorInt ) ? params.textColorInt:0,
                        isWriteMode = ( params.isWriteMode ) ? params.isWriteMode:false,
                        kind = $aWindow.data('kind'),
                        hash = ($aWindow.data('hash')) ? $aWindow.data('hash'):$aWindow.data('container'),
                        summary = ANT.summaries[hash],
                        totalReactions = (typeof summary != 'undefined')?summary.counts.tags:0,
                        content_node_id = (tag.content_node_id) ? tag.content_node_id:false,
                        content_node = (content_node_id) ? summary.content_nodes[ content_node_id ]:"",
                        message = '';


                    // CHANGETHIS
                    // delete??
                        // later, we'll allow rendering percentages on grids/etc, as an option
                    // var renderPercentages = (reactionViewStyle=='horizontal_bars') ? true:false;
                    // if (renderPercentages===true) {
                    //     tagPercent = parseInt(tagCount/totalReactions*100);
                    //     tagWidth = 'width:'+(Math.round(tagCount / summary.counts.highest_tag_count*75 )) + '%';
                    // }

                    // if (content_node_id == 'undefined'){
                        // return;
                    // }
                    if ( content_node_id ) {
                        content_node.id = content_node_id;
                    }

                    // NB: a bunch of the following junk is grid-specific, but is sort of ignored in CSS
                    // for ex,

                    // this can go away if we change CSS class names
                    var boxSize = ( boxSize == "big" ) ? "ant_box_big" : "ant_box_medium",
                      wideBox = "",
                      writeMode = ( isWriteMode ) ? 'ant_writeMode' : '',
                      tagBodyRaw = ( tag.body ) ? tag.body:tag.tag_body,
                      tagBodyRawWords = tagBodyRaw.split(' '),
                      lineOne = '',
                      lineTwo = '',
                      tagBodyHtml = "",
                      tagHtml = "",
                      tagIsSplitClass = "";

                    
                    if (typeof tagBodyRaw == 'undefined') { return; }

                    if (tagBodyRawWords.length == 1) {
                        lineOne = tagBodyRawWords[0];
                    } else {
                        $.each(tagBodyRawWords, function(idx, word) {
                            var spacer = (idx===0) ? '':' ';
                            if (lineOne.length < 11 && lineOne.length+word.length < 11) {
                                lineOne += spacer + word;
                            } else {
                                lineTwo += spacer + word;
                            }
                        });
                    }

                    // use single quotes in the string so the string concat works, and doesn't unexpectedly close the HTML style attribute in lineOne, lineTwo
                    ANT.group.tag_box_font_family = ANT.group.tag_box_font_family.replace(/['"]+/g, '\'');

                    lineOne = $.trim(lineOne) + ' '; // trim front space, add end space... won't wrap given css rule
                    var lineOneLength = ( lineOne.length > 17 ) ? "max" : lineOne.length;
                    lineOne = '<div class="ant_charCount_' + lineOneLength + '" style="font-family:'+ANT.group.tag_box_font_family+';">' + lineOne + '</div>';

                    if (lineTwo!='') {
                        lineTwo = $.trim(lineTwo);
                        var lineTwoLength = ( lineTwo.length > 17 ) ? "max" : lineTwo.length;
                        lineTwo = '<div class="ant_charCount_' + lineTwoLength + '" style="font-family:'+ANT.group.tag_box_font_family+';">' + lineTwo + '</div>';
                    }

                    tagBodyHtml = lineOne + lineTwo;

                    // need to limit each line to 10 characters OR start making smaller if no whitespace

                    var charCountText = ""

                    tagHtml = '<div class="ant_tag_body">'+tagBodyHtml+'</div>';

                    var tag_id = tag.id;
                    var parent_id = tag.parent_id;
                    var content_node_str = content_node_id ? 'ant_content_node_'+content_node_id : "";
                    var tagCount = tagCount || 0;
                    var tagCountDisplay = tagCount;
                    var searchCountDisplay = (tagCount===1) ? '':tagCountDisplay;


                    var tagActionsHtml = isWriteMode ?
                        '<span class="ant_plusOne">+1</span>' : 
                        
                            '<span class="ant_count" style="font-family:'+ANT.group.tag_box_font_family+';">'+tagCountDisplay+'</span>' +
                            '<span class="ant_plusOne" style="">+1</span>' +
                            ((kind=='page') ? '<span class="ant_search ant_tooltip_this" title="View content<br/>with this reaction"><i class="ant-search"></i></span>': '');


                    var tagBoxHTML = '<div class="'+boxSize+' ant_box '+wideBox+' '+writeMode+' row_num_'+rowNum+'">'+
                            '<div '+
                                'class="ant_tag '+tagIsSplitClass+' '+content_node_str+' '+charCountText+'" '+
                                'data-tag_id="'+tag_id+'" '+
                                'data-tag_count="'+tagCount+'" '+
                                'data-parent_id="'+parent_id+'" '+
                                'data-content_node_id="'+content_node_id+'" '+
                            '><div class="ant_tag_wrap"><div class="ant_tag_wrap2">'+
                                tagHtml+
                                '<div class="ant_tag_actions">'+
                                tagActionsHtml+
                                // plusOneCTA+
                                '</div>'+
                            '</div>'+
                        '</div></div></div>';

                    
                    var $tagBox = $(tagBoxHTML);
                    $tagContainer.append( $tagBox );

                    // figure out if we should add a comment indicator + comment hover
                    var comments = {},
                        num_comments = 0;

                    if ( !$.isEmptyObject( content_node ) && !$.isEmptyObject( content_node.top_interactions ) && !$.isEmptyObject( content_node.top_interactions.coms ) ) {

                        $.each( content_node.top_interactions.coms, function(idx, comment) {
                            if ( comment.tag_id == parseInt( tag.tag_id ) ) {
                                num_comments++;
                                if ( $.isEmptyObject( comments ) ) {
                                    comments = content_node.top_interactions.coms;
                                }
                            }
                        });
                    }

                    // //New Check 
                    var crazyCheckForDataTieOver = $.isEmptyObject(comments) && typeof summary != "undefined" && 
                        (summary.kind=="img" || summary.kind=="media" || summary.kind=="med") && 
                        !$.isEmptyObject(summary.top_interactions) &&
                        !$.isEmptyObject(summary.top_interactions.coms)

                    //really?
                    if(!tag.id){
                        tag.id = tag.tag_id;
                    }

                    if (crazyCheckForDataTieOver) {
                        comments = summary.top_interactions.coms[tag.id];
                        if ( !$.isEmptyObject( comments ) ){
                          num_comments = comments.length;
                        } 
                    }

                    // add the comment indicator + comment hover... if we should!
                    if ( !isWriteMode && kind != "page" ) {
                        var showCommentsBeforeHover = (num_comments>0) ? true:false,
                            comment_tooltip = 'View comments';
                        if (num_comments===0) { num_comments=''; comment_tooltip = 'Add comment here'; }
                    // if ( !$.isEmptyObject( comments ) && !isWriteMode ) {
                        var $commentHover = $('<span class="ant_comment_hover ant_tooltip_this '+((showCommentsBeforeHover)? '':'ant_hide')+'" title="'+comment_tooltip+'"></span>');

                        $commentHover.append( '<i class="ant-comment"></i> '+num_comments );
                        
                        if(isTouchBrowser){
                            $commentHover.on('touchend.ant', function() {
                                // replacewith bug
                                $(this).tooltip('hide');
                                ANT.actions.viewCommentContent({
                                    tag:tag,
                                    hash:hash,
                                    aWindow:$aWindow,
                                    content_node:content_node,
                                    selState:content_node.selState
                                });
                                return false;
                            });
                        }else{
                            $commentHover.click( function() {
                                // replacewith bug
                                $(this).tooltip('hide');
                                ANT.actions.viewCommentContent({
                                    tag:tag,
                                    hash:hash,
                                    aWindow:$aWindow,
                                    content_node:content_node,
                                    selState:content_node.selState
                                });
                                return false;
                            });
                        }

                        $tagBox.find('.ant_tag_actions').append( $commentHover );
                        // $commentHover.tooltip();
                    }
                    $tagBox.find('.ant_tooltip_this').tooltip();

                    function renderReactedContent( $reactionsTable, tag ) {
                        if ( !$aWindow.find('.ant_view_more').length || !$aWindow.find('.ant_view_more').hasClass('ant_visiblePanel') ) {
                            var $newPanel = ANT.aWindow.panelCreate( $aWindow, 'ant_view_more' );
                            var $ant_body_wrap = $aWindow.find('div.ant_body_wrap');
                            $ant_body_wrap.append( $newPanel );

                            $newPanel.append( $reactionsTable ).addClass('ant_page_reactions_summary');

                            ANT.aWindow.tagBox.setWidth( $aWindow, 222 );
                            ANT.aWindow.panelShow( $aWindow, $newPanel, function() {
                                ANT.aWindow.hideFooter($aWindow);
                            });
                        } else {
                            $aWindow.find('.ant_body').html( $reactionsTable );
                            ANT.aWindow.jspUpdate( $aWindow );
                        }

                        var HeaderTxt = (tag.tag_count <= 0) ? 
                            "no reactions" :
                                (tag.tag_count == 1) ?
                                "1 " + ANT.t('single_reaction') :
                                tag.tag_count + " " + ANT.t('plural_reaction');
                        var $header = ANT.aWindow.makeHeader( HeaderTxt );
                            $aWindow.find('.ant_header').replaceWith($header)
                    } // renderReactedContent

                    function _makeBackButton(){
                        var $backButton = $('<div class="ant_back">'+ANT.t('close')+' X</div>');
                        $backButton.on('click.ant, touchend.ant', function() {


                            //temp fix because the aWindow scrollpane re-init isnt working
                            // var isViewForAWindow = !!$aWindow.attr('ant-view-reactions-for');
                            // if(!isViewForAWindow){
                                ANT.aWindow.close($aWindow);
                                return;
                            // }

                        });
                        return $backButton;
                    }

                    function createReactedContentTable($this, counts, pageId) {

                        $().selog('hilite', true, 'off');
                        $('.ant_twtooltip').remove();
                        var $backButton = _makeBackButton(),
                            $reactionsTable = $('<table cellpadding="0" cellspacing="0" border="0" class="reaction_summary_table"></table>').append('<tbody><tr class="ant_page_reactions"></tr></tbody>');

                        // add count of page-level reactions
                        if ( counts && counts.page && counts.page > 0 ) {
                            var page_reaction_text =
                                (counts.page == 1 ) ?
                                "1 " + ANT.t('single_reaction') :
                                counts.page + " " + ANT.t('plural_reaction');

                            $reactionsTable.find('.ant_page_reactions').append('<td colspan="2"><strong>'+page_reaction_text+'</strong> '+ANT.t('to_page')+'</td>');
                        }

                        if ( counts.img > 0 || counts.text > 0 || counts.media > 0 ) {
                            // iterate through and create an array of counts + $tr.  this is then sortable.
                            $reactionsTable.find('.ant_page_reactions').addClass('has_other_reactions');
                            $.each( ANT.interaction_data[ tag.id ], function(int_id, data) {

                                //quick fix for multi page reactions.
                                // todo: #summaryContentByPageFix
                                var hash = data.hash;
                                var summary = ANT.summaries[hash];
                                var $node = $('[ant-hash="' + hash + '"]');
                                var thisPageId = summary.pageId;

                                if(
                                    !thisPageId || 
                                    !pageId ||
                                    (thisPageId != pageId)
                                ){
                                    return;
                                }

                                if ( !$reactionsTable.find('tr.ant_int_summary_'+int_id).length ) {
                                    var $tr = $('<tr valign="middle" class="ant_content_reaction ant_int_summary_'+int_id+'"/>'),
                                        thing = ANT.interaction_data[ tag.id ][ int_id ];

                                    if (typeof thing.interaction != "undefined" && typeof thing.content_node != "undefined" ) {
                                        var reaction_word = (thing.interaction.count>1) ? ANT.t('plural_reaction') : ANT.t('single_reaction');
                                        $tr.append('<td class="ant_count"><h4>'+thing.interaction.count+'</h4><h5>'+reaction_word+'</h5></td>')//chain
                                        .data('count', thing.interaction.count)//chain
                                        .data('tag', tag)//chain
                                        .data('int_id', int_id);

                                        if ( thing.kind == "text" ) {
                                            $tr.append('<td class="ant_content">'+thing.content_node.body+'</td>');
                                        } else if ( thing.kind == "img" ) {
                                            $tr.append('<td class="ant_content"><img src="'+thing.content_node.body+'" height="50"/></td>');
                                        } else if ( thing.kind == "media" ) {
                                            $tr.append('<td class="ant_content"><img src="'+ANT_baseUrl+'/static/widget/images/video_icon.png" height="33" style="margin-bottom:-10px;"/> <div style="display:inline-block;margin-left:10px;">Video</div></td>');
                                        }

                                        $tr.on('click.ant, touchend.ant', function(e) {
                                            e.preventDefault();
                                            var data = {
                                                container_hash:thing.hash,
                                                location:thing.content_node.location
                                            };
                                            ANT.session.revealSharedContent(data);

                                            ANT.events.trackEventToCloud({
                                                event_type: 'sb',
                                                event_value: 'vc',
                                                page_id: thisPageId
                                            });
                                        });

                                        // insert the new content into the right place, ordered by count
                                        if ( !$reactionsTable.find('tr.ant_content_reaction').length ) {
                                            $reactionsTable.find('tbody').append( $tr );
                                        } else {
                                            var insertIndex = 0;
                                            $.each( $reactionsTable.find('tr.ant_content_reaction'), function(idx, existing_tr) {
                                                if ( parseInt(thing.interaction.count) > parseInt($(existing_tr).data('count')) ) {
                                                    insertIndex = idx;
                                                    return false;
                                                }
                                            });
                                            $reactionsTable.find('tr.ant_content_reaction:eq('+insertIndex+')').before( $tr );
                                        }
                                    }
                                }
                            });
                        }
                        return $('<div/>').append( $backButton, $reactionsTable );
                    } // createReactedContentTable

                    var clickOrTouch = (isTouchBrowser) ? 'touchend.ant':'click.ant';
                    // kind-specific click event
                    // porter resume here.  make sure the counts and write element are passed into getReactedContent
                    if ( kind == "page" ) {

                        // make the search icon un-show +1
                        $tagBox.find('.ant_search').hover( 
                            function() {
                                $(this).closest('.ant_box').toggleClass('hidePlusOne');
                            });

                        // if ( isWriteMode == false ) {
                            
                            var clickFunc = function(){


                                ANT.aWindow.hideFooter($aWindow);
                                $aWindow.removeClass('ant_rewritable');

                                var page_id = ANT.util.getPageProperty('id', hash),
                                    page = ANT.pages[ page_id ],
                                    tag_count = tag.tag_count,
                                    counts = {
                                        "img":0,
                                        "text":0,
                                        "media":0,
                                        "page":(tag_count=="+")?0:tag_count
                                    };
                                

                                ANT.events.trackEventToCloud({
                                    event_type: 'sb',
                                    event_value: 'vr',
                                    page_id: page_id
                                });


                                $.each( page.containers, function( idx, container ) {
                                    if ( ANT.summaries && ANT.summaries[container.hash] && ANT.summaries[container.hash].top_interactions ) {
                                        if ( ANT.summaries[container.hash].top_interactions.tags && ANT.summaries[container.hash].top_interactions.tags[tag.id] ) {
                                            counts[ANT.summaries[container.hash].kind] += ANT.summaries[container.hash].top_interactions.tags[tag.id].count;
                                            counts.page -= ANT.summaries[container.hash].top_interactions.tags[tag.id].count;
                                        }
                                    }
                                });

                                var $this = $(this),
                                    $reactionsTable = createReactedContentTable($this, counts, page.id);

                                renderReactedContent( $reactionsTable, tag );
                                $this.addClass('ant_live_hover');
                            };

                            $tagBox.find('.ant_search').on( clickOrTouch, function(e){
                                if (e) e.preventDefault();
                                clickFunc();
                                return false;
                            });


                        // } else {
                            $tagBox.on(clickOrTouch, function(e) {
                                if ( ANT.util.isTouchDragging(e) ) { return; }
                                if (ANT.util.bubblingEvents['touchend'] == false) {
                                    $(this).addClass('ant_tagged');
                                    $aWindow.removeClass('ant_rewritable');
                                    var hash = $aWindow.data('container');
                                    args = { tag:tag, hash:hash, uiMode:'writeMode', kind:$aWindow.data('kind'), aWindow:$aWindow, content_node:content_node};
                                    ANT.actions.interactions.ajax( args, 'react', 'create');
                                }
                            });
                        // }
                    } else {
                        // CHANGETHIS
                        // may not need the code below and just above... seems identical now.
                        // move outside the if statement?

                        // if(isTouchBrowser){
                            // mobiletodo.  simulate hover and a css class.
                            // check for class, and if present, simulate click
                            $tagBox.on( clickOrTouch, function(e) {
                                if ( ANT.util.isTouchDragging(e) ) { return; }
                                if (ANT.util.bubblingEvents['touchend'] == false) {
                                    $(this).addClass('ant_tagged');
                                    $aWindow.removeClass('ant_rewritable');
                                    var hash = $aWindow.data('container');
                                    args = { tag:tag, hash:hash, uiMode:'writeMode', kind:$aWindow.data('kind'), aWindow:$aWindow, content_node:content_node};
                                    ANT.actions.interactions.ajax( args, 'react', 'create');
                                }
                            });
                        // }else{
                            // $tagBox.click( function() {
                            //     $(this).addClass('ant_tagged');
                            //     $aWindow.removeClass('ant_rewritable');
                            //     var hash = $aWindow.data('container');
                            //     args = { tag:tag, hash:hash, uiMode:'writeMode', kind:$aWindow.data('kind'), aWindow:$aWindow, content_node:content_node};
                            //     ANT.actions.interactions.ajax( args, 'react', 'create');
                            // });
                        // }
                    }

                    // global (all kinds) hover event
                    if(!isTouchBrowser){
                        $tagBox.hover(function() {
                            var $this = $(this);
                            if ( !$this.hasClass('ant_tagged') ) {
                                var $tagCount = $this.find('span.ant_tag_count');
                                $tagCount.width( $tagCount.width() );
                                $tagCount.text('+');
                            }
                        }, function() {
                            var $this = $(this);
                            $this.find('span.ant_tag_count').text( $this.find('.ant_tag').data('tag_count') );
                        });
                    }

                    // $container.append( $tagBox, " " );
                    
                    return $tagBox;
                }
            },
            writeCustomTag: function( $container, $aWindow, actionType ) {
                //ANT.aWindow.writeCustomTag
                // think we don't need $container or actionType

                var $container = $aWindow.find('.ant_footer');
                $container.append( '<div class="ant_box"></div><a class="antenna-logo-link" target="_blank" href="'+ window.location.protocol + '//www.antenna.is/">Antenna</a>');

                if ( $container.find('div.ant_custom_tag').not('div.ant_custom_tag.ant_tagged').length == 0) {
                    var actionType = ( actionType ) ? actionType : "react",
                        helpText = "+ " + ANT.t('add_custom');

                    // add custom tag
                    var $clickOverlay = $('<div class="ant_click_overlay"></div>').appendTo($container);
                    var $custom = $('<div class="ant_tag ant_custom_tag"></div>');
                    var $customInput = $('<input value="'+helpText+'" />').appendTo($custom);
                    var $customSubmit = $('<button class="ant_custom_tag_submit" name="ant_custom_tag_submit">ok</button>').appendTo($custom);
                    $customSubmit.click(function(){
                        submitCustomTag($custom, $customInput);
                    });
                    
                    $clickOverlay.click(function(){
                        $customInput.focus();
                    });
                                        
                    $customInput.focus( function() {
                        // ANT.events.track('start_custom_reaction_aWindow');
                        var $input = $(this);
                        $input.removeClass('ant_default');
                        if ( $input.val() == helpText ) {
                            $input.val('');
                        }

                        $clickOverlay.hide();
                        $customSubmit.css('display','inline-block');

                        $aWindow.removeClass('ant_rewritable');

                    }).blur( function() {
                        var $input = $(this);
                        if ( $input.val() === "" ) {
                            $input.val( helpText );
                            $customSubmit.hide();
                            $clickOverlay.show();
                        }
                        if ( $input.val() == helpText ) {
                            $input.addClass('ant_default');
                            $customSubmit.hide();
                            $clickOverlay.show();              
                        }
                        $input.closest('div.ant_tag').removeClass('ant_hover');
                        
                    }).keyup( function(event) {
                        var $input = $customInput;
                        if (event.keyCode == '13') { //enter.  removed comma...  || event.keyCode == '188'
                            submitCustomTag($custom, $customInput);
                        }
                        else if (event.keyCode == '27') { //esc
                            $input.blur();
                            // return false so the aWindow doesn't close.
                            return false;
                        } else if ( $input.val().length > 25 ) {
                            var customTag = $input.val();
                            $input.val( customTag.substr(0, 25) );
                        }
                    });

                    $container.find('.ant_box').append( $custom, " " );

                    function submitCustomTag($custom, $customInput){
                        var tag = {},
                            hash = $aWindow.data('container');
                            //note that hash is a $(dom) element, not a hash.  Fix this later.
                        
                        var val = $customInput.val();
                        if(val === ""){
                            return;
                        }
                        tag.body = val;

                        $custom.parent().addClass('ant_tagged');

                        // args = { tag:tag, hash:hash, kind:"page" };
                        args = { tag:tag, hash:hash, uiMode:'writeMode', kind:$aWindow.data('kind'), aWindow:$aWindow};
                        ANT.actions.interactions.ajax( args, actionType, 'create' );
                        $customInput.blur();
                        // $custom.tooltip();
                    }

                    $(document).on('keydown.ant', function(event) {
                        // this won't be international-friendly -- it's a list of letters, numbers, punctuation, plus SHIFT
                        keyCodes = [16, 81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 65, 83, 68, 70, 71, 72, 74, 75, 76, 90, 88, 67, 86, 66, 78, 77, 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 189, 187, 219, 221, 220, 186, 222, 188, 190, 191, 192];
                        if ( $.inArray(event.keyCode, keyCodes) != -1 ) {
                            $container.find('input').focus();
                        }
                    });
                }
            },
            _aWindowTypes: {
                //ANT.aWindow._aWindowTypes:
                tagMode: {
                    //ANT.aWindow._aWindowTypes.tagMode.make(settings);
                    // [porter] we should change the name of this function.  no need to nest under _aWindowTypes anymore, right?
                    make: function(settings){
                        // ANT.aWindow._aWindowTypes.writeMode.make:
                        // as the underscore suggests, this should not be called directly.  Instead, use ANT.aWindow.make(aWindowType [,options])
                        // this is where we freaking make windows.  makewindow.  yay abstracting parameters into functions.
                        if ( settings.is_page == true ) {
                            var page = settings.page,
                                $summary_widget = $('.ant-summary-'+page.id),
                                $summary_widget_icon = $summary_widget.find('.ant_logo'),
                                coords = {
                                    top: $summary_widget_icon.offset().top - 11,
                                    left: $summary_widget_icon.offset().left - 9
                                };

                            // don't redraw summary aWindow if already showing
                            if ( $('div.ant_page_key_' + $summary_widget.data('page_key') ).length ) {
                                return;
                            }

                            var $aWindow = ANT.aWindow.draw({
                                    coords: coords,
                                    container: $summary_widget,
                                    content: 'page',
                                    kind: 'page',
                                    mode:settings.mode
                                });

                        } else {
                            var hash = settings.hash;
                            var page_id = ANT.util.getPageProperty('id', hash );

                            var summary = ANT.summaries[hash],
                                $container = summary.$container,
                                kind = summary.kind,
                                rewritable = (settings.rewritable == false) ? false:true,
                                coords = (settings.coords) ? settings.coords:{};

                            var actionType = (settings.actionType) ? settings.actionType:"react";

                            // gets used in both read & write mode aWindow placement calculations
                            var containerWidth = $container.width();
                            var containerHeight = $container.height();

                            /* START create aWindow based on write vs. read mode */
                            if ( settings.mode == "writeMode" ) {
                                // show writemode text
                                // writeMode
                                

                                // ANT.events.track('start_react_text');
                                ANT.events.trackEventToCloud({
                                    // category: "engage",
                                    // action: "aWindow_shown_writemode",
                                    event_type: 'rs',
                                    event_value: 'wr',
                                    // opt_label: "kind: text, hash: " + hash,
                                    container_hash: hash,
                                    container_kind: kind,
                                    page_id: page_id
                                });


                                var newSel;
                                if ( kind == "text" ) {
                                    // TEXTACTIONBAR

                                    //Trigger the smart text selection and highlight
                                    newSel = $container.selog('helpers', 'smartHilite');
                                    if(!newSel) return false;

                                    //temp fix to set the content (the text) of the selection to the new selection
                                    //todo: make selog more integrated with the rest of the code
                                    settings.content = newSel.text;
                                    if (!coords.force) {
                                        coords.left = coords.left + 40;
                                        coords.top = coords.top + 35;
                                    } else {
                                        // force is only used from a write-mode paragraph helper, i think
                                        coords.top = coords.top - 15;
                                    }

                                    //if sel exists, reset the offset coords
                                    if(newSel){
                                        //todo - combine with copy of this
                                        var hiliter = newSel.hiliter,
                                        $hiliteEnd = hiliter.get$end();

                                        //testing adjusting the position with overrides from the hilite span
                                        if( $hiliteEnd ){
                                            var $helper = $('<span />');
                                            $helper.insertAfter( $hiliteEnd );
                                            if (!coords.force) {
                                                var strRight = $helper.offset().right;
                                                var strBottom = $helper.offset().bottom;
                                                coords.left = strRight - 14; //with a little padding
                                                coords.top = strBottom + 2;
                                            }

                                            $helper.remove();
                                        }
                                    }

                                    // override the coordinates.  the selection-based stuff fails on iPhone after you scroll down.
                                    if (isTouchBrowser) {
                                        var $container = $('[ant-hash="'+hash+'"]'),
                                            containerWidth = $container.width(),
                                            containerOffsetLeft = $container.offset().left,
                                            aWindowWidthOffset = -111;  // aWindows are 222px wide, so pull left

                                        var coords = {
                                            top: $container.offset().bottom+10,
                                            left: (containerWidth/2) + containerOffsetLeft + aWindowWidthOffset
                                        };
                                    }
                                } else {
                                    if (typeof settings.coords != 'undefined' && settings.coords.force) {
                                        var coords = settings.coords;
                                    }else {
                                    // draw the window over the actionbar
                                    // need to do media border hilites
                                    var indicatorOffsets = summary.$indicator.offset();
                                    var coords = {};
                                        coords.top = indicatorOffsets.top;
                                        coords.left =  indicatorOffsets.left;
                                    }
                                }
                            } else {
                                // readMode
                                // show readmode 
                                var selector = '[ant-hash="' + hash + '"]';

                                var $indicator = $('#ant_indicator_'+hash),
                                $indicator_body = $('#ant_indicator_body_'+ hash),
                                $container = $('[ant-hash="'+hash+'"]');

                                if ( kind == "text" ) {
                                    coords = {
                                        top: $indicator_body.offset().top,
                                        left: $indicator_body.offset().left
                                    };
                                } else {
                                    // var modTop = (kind=='img') ? - 24 : -5;
                                    // var coords = {
                                    //     top: $container.offset().bottom+5,
                                    //     left: $container.offset().left
                                    // };
                                    // var topValue = ( !$container.parents( ANT.group.img_container_selectors ).length ) ? $container.offset().bottom + modTop : $container.parents( ANT.group.img_container_selectors ).first().offset().bottom + 5;
                                    // var coords = {
                                    //     top: topValue,
                                    //     left: $container.offset().left + 12
                                    // };
                                    var indicatorOffsets = summary.$indicator.offset();
                                    var coords = {};
                                        coords.top = indicatorOffsets.top;
                                        coords.left =  indicatorOffsets.left;

                                    //log media readmode
                                    // ANT.events.track( 'view_node::'+hash, hash );
                                    ANT.events.trackEventToCloud({
                                        // category: "engage",
                                        // action: "aWindow_shown_readmode",
                                        // opt_label: "kind: "+kind+", hash: " + hash,
                                        event_type: 'rs',
                                        // event_value: 'rd',
                                        event_value: (typeof summary.counts.highest_tag_count != 'undefined') ? 'rd':'rd-zero',
                                        container_hash: hash,
                                        container_kind: kind,
                                        page_id: page_id
                                    });

                                    ANT.events.emit('antenna.reactionview', '', { 'hash':hash, 'kind':kind });

                                }

                                // $indicatorDetails.hide();
                            }

                            // if there is a custom CTA element, override the coordinates with its location
                            if ( typeof settings.$custom_cta != "undefined" ) {
                                var offsets = settings.$custom_cta.offset();
                                if (isTouchBrowser) {
                                    var coords = {
                                        top: offsets.bottom+5,
                                        left: offsets.left
                                    };
                                } else {
                                    var ant_offset_x = (settings.$custom_cta.attr('ant-offset-x')) ? parseInt(settings.$custom_cta.attr('ant-offset-x')) : 0;
                                    var ant_offset_y = (settings.$custom_cta.attr('ant-offset-y')) ? parseInt(settings.$custom_cta.attr('ant-offset-y')) : 0;
                                    coords.top = offsets.top + ant_offset_y;
                                    coords.left = offsets.left + ant_offset_x;
                                }

                            }

                            var $aWindow = ANT.aWindow.draw({
                                coords: coords,
                                container: hash,
                                content: settings.content,
                                kind: kind,
                                selState: newSel,
                                rewritable:rewritable,
                                mode:settings.mode
                            });
                            //later we should consolodate the use of 'container' and 'hash' as the key
                            $aWindow.data('hash', hash);
                            summary['$aWindow_'+settings.mode.toLowerCase()] = $aWindow;
                        }

                        /* END create aWindow based on write vs. read mode */

                        $aWindow.addClass('ant_'+settings.mode.toLowerCase());

                        /* START populate the header */
                        var headerText = ANT.aWindow.makeDefaultPanelMessage($aWindow);

                        var $header = ANT.aWindow.makeHeader( headerText );
                        $aWindow.find('.ant_header').replaceWith($header);

                        /* START create the tag boxes.  read / write mode matters. (??) */
                        $aWindow.addClass('ant_reactions');

                        var $bodyWrap = $aWindow.find('div.ant_body_wrap');

                        var $oldTagList = $aWindow.find('div.ant_body');
                        if($oldTagList.length){
                            $oldTagList.remove();
                        }

                        // write inline tags: initial aWindow instantiation
                        if ( settings.is_page == true ) {
                            var $tagList = ANT.actions.indicators.utils.makeTagsListForInline( $aWindow, settings.mode == "writeMode", page ); // it's usually/always? readMode, so the second arg there wil be false
                        } else {
                            var $tagList = ANT.actions.indicators.utils.makeTagsListForInline( $aWindow, settings.mode == "writeMode" );
                        }
                        $bodyWrap.append($tagList);
                        /* END create the tag boxes.  read / write mode matters. */

                        /* START modify the aWindow size */
                        var contentWidth = $bodyWrap.width(),
                            contentHeight = $bodyWrap.height();

                        $aWindow.css('left', coords.left + 'px').css('top', coords.top + 'px');

                        $aWindow.animate({
                            width:contentWidth
                        }, 333, 'swing' );

                        $aWindow.data( 'initialWidth', contentWidth ).data('initialHeight', contentHeight );


                        //todo
                        $aWindow.find('div.ant_cell_wrapper div.ant_tag').css({'width':'100%'});
                        // $aWindow.find('div.ant_custom_tag input').focus();

                        // return $aWindow to ANT.aWindow.make
                        return $aWindow;

                        /* END modify the aWindow size */
                    },
                    customOptions: {

                    },
                    setup: function(){

                    }
                }
            },
            make: function(aWindowType, options){
                //ANT.aWindow.make:
                //temp tie-over
                var hash = options.hash,
                    summary = ANT.summaries[hash],
                    kind = options.kind,
                    isPage = options.is_page;

                if (!isPage && !summary) {
                    // setup the summary
                    // FORCING SUMMARY CREATION
                    var summary = ANT.util.makeEmptySummary(hash);
                    ANT.actions.containers.setup(summary);
                }
                // summary = ANT.summaries[hash];

                //checks for aWindowType
                if ( !aWindowType ) aWindowType = "readMode";
                // if ( !ANT.aWindow._aWindowTypes.hasOwnProperty(aWindowType) ) return;
                //else

                var defaultOptions = ANT.aWindow.defaults,
                    customOptions = ANT.aWindow._aWindowTypes.customOptions,
                    settings = $.extend( {}, defaultOptions, customOptions, options, {mode:aWindowType} );
                //call make function for appropriate type

                var $aWindow = ANT.aWindow._aWindowTypes.tagMode.make(settings);

                if (typeof $aWindow != 'undefined') {
//CHANGETHIS?
                    // animate window in... just opacity for now.  changing size screws with isotopeFillGap()
                    setTimeout(function() {
                        $aWindow.addClass('ant_show');

                    }, 1);
                        ANT.util.stayInWindow( $aWindow );
                
                    // return $aWindow to whatever called ANT.aWindow.make
                    return $aWindow;
                }

            },
            draw: function(options) {
                //ANT.aWindow.draw:

                /*
                //options are:
                {
                    coords:{
                        left:100,
                        top:100
                    },
                    pnlWidth:200,
                    noHeader:true,
                    container: hash,
                    content: settings.content,
                    kind: kind,
                    selState: newSel,
                    selector:selector,
                    id: "ant_loginPanel",
                    pnls:1,
                    height:225,
                    animTime:100,
                    maxHeight: 350
                }
                */

                //at least for now, always close all other aWindows.
                // unless its the login window.   i know,i know, bad parameter to use for this.
                if (!options.purpose || options.purpose != 'login'){
                    ANT.aWindow.closeAll();
                }

                if ( options.selector && !options.container ) {
                    options.container = options.selector.substr(5);
                }
                // for now, any window closes all tooltips
                //merge options and defaults

                var settings = $.extend({}, this.defaults, options);

                var minHeight = (settings.minHeight<60)?60:settings.minHeight,
                    maxHeight = settings.maxHeight;
                    minWidth = settings.minWidth,
                    maxWidth = settings.maxWidth,
                    ant_for = ( typeof settings.container == "string" ) ? 'ant_for_'+settings.container:'ant_for_page',
                    $new_aWindow = $('<div class="ant ant_window ant_rewritable ant_widget w111 '+ant_for+'"></div>');

                if ( settings.id ) {
                    $('#'+settings.id).remove(); 
                    // todo not sure we should always just REMOVE a pre-existing aWindow with a particular ID...
                    // reason I'm adding this: want a login panel with an ID and data attached to it, so after a user
                    // logs in, the login aWindow knows what function to then call
                    $new_aWindow.attr('id',settings.id);
                }

                //this is instead of the if / else below
                $('#ant_sandbox').append( $new_aWindow );
                
                if ( settings.kind == "page" ) {
                    $new_aWindow.addClass('ant_page_key_' + options.container.data('page_key') ).addClass('ant_page_summary');
                }

                $new_aWindow.data(settings);
                
                if ( $new_aWindow.find('div.ant_header').length === 0 ) {  // not sure why this conditional is here.  [pb] b/c just above, it's possible a aWindow exists and we want to use that.
                    $new_aWindow.html('');
                    $new_aWindow.append(
                        '<div class="ant ant_header">'+
                            // '<div class="ant_header_arrow"><img src="'+ANT_staticUrl+'widget/images/header_up_arrow.png" /></div>'+
                            '<div class="ant_loader"></div>'+
                            // '<div class="ant_about"><a href="http://www.antenna.is/" target="_blank">&nbsp;</a></div>'+
                        '</div>'+
                        '<div class="ant ant_body_wrap ant_clearfix"></div>'+
                        '<div class="ant ant_footer"></div>'
                    );

                    if ( settings.noHeader ) $new_aWindow.find('div.ant_header').remove();  // haha.  let's manipulate the DOM twice.  (Add then remove.)

                    // $new_aWindow.draggable({
                    //     handle:'.ant_header', //todo: move the header_overlay inside the header so we don't need this hack
                    //     containment:'document',
                    //     stack:'.ant_window',
                    //     start:function() {
                    //         $(this).removeClass('ant_rewritable');
                    //     }
                    // });
                    $new_aWindow.drags({
                        handle:'.ant_header' //todo: move the header_overlay inside the header so we don't need this hack
                        // containment:'document',
                        // stack:'.ant_window',
                        // start:function() {
                            // $(this).removeClass('ant_rewritable');
                        // }
                    });
                }
                var coords = settings.coords;

                $new_aWindow.css('left', coords.left + 'px');
                $new_aWindow.css('top', coords.top + 'px');
                if(settings.height){
                    $new_aWindow.height(settings.height);
                }
                // do we need to call this twice in this function?
                ANT.actionbar.closeAll();

                $new_aWindow.settings = settings;

                // $new_aWindow.on( "resizestop.ant", function(event, ui) {
                //     var $this = $(this);
                    
                //     //todo: examine resize
                //     // ANT.aWindow.updateSizes( $this );
                // });

                if ( ANT.actions.indicators.showOnlyInitial === true && settings.mode.indexOf('read') != -1) {
                    ANT.actions.indicators.showOnlyInitial = false;
                    ANT.actions.summaries.showLessPopularIndicators();
                }

                return $new_aWindow;
            },
            safeClose: function( $aWindow ) {
              //ANT.aWindow.safeClose:

              // var isView = !!$aWindow.attr('ant-view-reactions-for');

              // if(isView){

              //   var $header = ANT.aWindow.makeHeader( ANT.t('reactions') );
              //       $aWindow.find('.ant_header').replaceWith($header);
              //       ANT.aWindow.updateFooter( $aWindow );

              //       var $panelWrap = $aWindow.find('.ant_body_wrap'),
              //           $currentlyVisiblePanel = $panelWrap.find('.ant_visiblePanel'),
              //           $currentlyHiddenPanel = $panelWrap.find('.ant_hiddenPanel');
                    
              //       $panelWrap.animate({
              //           left: 0
              //       });

              //       $currentlyVisiblePanel.removeClass('ant_visiblePanel').addClass('ant_hiddenPanel');
              //       $currentlyHiddenPanel.removeClass('ant_hiddenPanel').addClass('ant_visiblePanel');

              //   return true;
              // }

              ANT.aWindow.close($aWindow);
              return true;
            },
            close: function( $aWindows ) {
                //ANT.aWindow.close:
                ANT.aWindow.clearHilites( $aWindows );
                $aWindows.each(function(idx,aWindow){
                    $(aWindow).remove();
                });

                //todo: move this - this is a temp shotgun spray approach.
                //toggled to hidden in ANT.aWindow._aWindowTypes.readMode.make:
                $('#ant_indicator_details_wrapper').find('.ant_body_wrap').css({
                   'visibility':'visible'
                });
            },
            closeAll: function() {
                var $allAWindows = $('div.ant.ant_window').not('.ant_no_clear');
                ANT.aWindow.close( $allAWindows );
                $('.ant_shared').removeClass('ant_shared');
                $(document).off('keydown.ant'); // remove the "start typing to immediately add a custom tag" feature
            },
            clearHilites: function( $aWindows ){
                var selStates = [];
                $aWindows.each(function(idx,aWindow){
                    var hash = $(aWindow).data('container');

                    //if not a aWindow for a container, there won't be any hilites.
                    if ( typeof hash === 'undefined' ) return;
                    //else

                    var summary = ANT.summaries[hash];

                    //todo: think about better name and pattern for how write-mode hilite gets stored.
                    //first find writeMode selState
                    var selState = $(aWindow).data('selState');
                    if ( typeof selState !== 'undefined' && selState !== ""){
                        //note that image aWindows have no hilite, but this takes care of that.
                        selStates.push(selState);
                    }

                    //let content_nodes stay [] if summary doesn't no data has been loaded (for a page with no reactions)
                    var content_nodes = [];
                    if( summary && summary.hasOwnProperty('content_nodes') ){
                        content_nodes = summary.content_nodes;
                    }

                    //now add any content hilites from hover states that might be hanging around.
                    $.each( content_nodes, function(key, node){
                        var selState = node.selState;
                        if ( typeof selState !== 'undefined' ){
                            selStates.push(selState);
                        }
                    });
                });

                $.each( selStates, function(idx, selState){
                    try{
                        $().selog('hilite', selState, 'off');
                    }
                    catch(err){
                    }
                });
            },
            update: function(hash, diffNode){
                //ANT.aWindow.update:
                var summary = ANT.summaries[hash],
                    $aWindow_readmode = summary.$aWindow_readmode,
                    $aWindow_writemode = summary.$aWindow_writemode;

                if( diffNode){
                    if( diffNode.int_type == "coms" ){
                        if($aWindow_writemode && $aWindow_writemode.length){

                            //add the content_id class to the tags
                            $tags = $aWindow_writemode.find('.ant_tags').find('.ant_tag');
                            $tags.addClass('ant_content_node_'+diffNode.content_id);

                            _addComIndicator($aWindow_writemode, diffNode);
                        }
                        if($aWindow_readmode && $aWindow_readmode.length){
                            _addComIndicator($aWindow_readmode, diffNode);
                        }else{
                            //image container.
                            var $aWindow = $('#ant_indicator_details_'+hash);

                            //add the content_id class to the tags
                            $tags = $aWindow.find('.ant_tags').find('.ant_tag');
                            $tags.addClass('ant_content_node_'+diffNode.content_id);

                            _addComIndicator($aWindow, diffNode);
                        }
                    }
                }else{
                    //yuck - improve this later
                    //right now this is just being used as a call to 'init' the aWindow state for media
                    var isMedia = ( summary.kind && ( summary.kind == "img" || summary.kind == "media" || summary.kind == "med") );
                    if(!isMedia){
                        return;
                    }
                    ANT.actions.indicators.utils.makeDetailsContent(hash);
                }

                function _addComIndicator($aWindow, diffNode){
                    var $tags, $tag;
                    $tags = $aWindow.find('.ant_tags');

                    //todo: we also need the contentnode id to make this unique
                    //The class looks like this: ant_tag ant_tag_368 ant_content_node_518
                    $tag = $tags
                        .find('.ant_tag_'+diffNode.parent_interaction_node.id)
                        .filter(function(){
                            return $(this).hasClass('ant_content_node_'+diffNode.content_id);
                        });

                    $tag.addClass('ant_comment_indicator');
                    _tempCopyOfCommentHover(diffNode, $tag, $aWindow);
                    _tempMakeAWindowResizeIfOneColumnWhenAddingFirstComment( $aWindow ); // deprecated?
                    _addLinkToViewComs(diffNode, $tag, $aWindow);


                }

                function _tempMakeAWindowResizeIfOneColumnWhenAddingFirstComment($aWindow) {
                    // deprecated?
                    var $tag_table = $aWindow.find('table.ant_tags')

                    // this is a duplication of code from elsewhere:
                    if ( $tag_table.find('tr:eq(0)').find('td').length == 1 ) {
                        $tag_table.addClass('ant-one-column');

                        if(!isTouchBrowser){
                            $tag_table.find('td.ant_has_pillHover').on('mouseenter.ant, mousemove.ant', function() {
                                var $this = $(this),
                                    $aWindow = $this.closest('div.ant_window');

                                thisWidth = $aWindow.data('initialWidth');
                            }).on('mouseleave.ant', function() {
                                var $this = $(this),
                                    $aWindow = $this.closest('div.ant_window');
                                thisWidth = $aWindow.width();
                            });
                        }
                    }
                }

                function _tempCopyOfCommentHover(diffNode, $tag, $aWindow){

                    //some crazy logic here to get the nodes per tag and per comment
                    //simplify our data structure later
                    var contentNodes = summary.content_nodes;
                    var contentNodesByContentId = contentNodes[diffNode.content_id];
                    
                    if(contentNodesByContentId){
                        var comsPerContentNodeId = contentNodesByContentId.top_interactions.coms;
                    }else{
                        var err = $.mustache(
                            'contentNode not found by id: {{id}}.  Figure out why nodeId was saved as "undefined".',
                            {id: diffNode.content_id}
                        );
                        ANT.safeThrow(err);
                        
                        //this didn't fix the problem anyway - leave it out.
                        //try to recover
                        // try{
                        //     var comsPerContentNodeId = ANT.content_nodes[hash]['undefined'].top_interactions.coms;
                        // }
                        // catch(e){
                        //     ANT.safeThrow(e);
                        //     return;
                        // }
                    }
                    

                    //filter so we get only the coms per this tagBox (tag_id and content_id)
                    var comsPerContentNodeAndTagId = $.map( comsPerContentNodeId, function(node){
                        return (node.tag_id === diffNode.tag_id ? node : null);
                    });

                    var num_comments = comsPerContentNodeAndTagId.length;

                    //just to match out copied function.
                    var $a = $tag;

                    var tag = diffNode.parent_interaction_node;
                    var content_node = diffNode.content_node;


                    //remove any existing comment shit so we can remake it
                    $a.find('.ant_comment_hover').remove();
                    $a.find('.ant_comment_indicator').remove();

                    var $commentHover = $('<span class="ant_comment_hover"/>');


                    $commentHover.append( '<span class="ant_icon"></span> '+num_comments );
                    $commentHover.click( function() {

                        ANT.actions.viewCommentContent({
                            tag:tag,
                            hash:hash,
                            aWindow:$aWindow,
                            content_node:content_node,
                            selState:content_node.selState
                        });
                    });

                    $a.append( $commentHover );
                    $a.closest('td').addClass('ant_has_pillHover'); // deprecated?

                }
                function _addLinkToViewComs(diffNode, $tag, $aWindow){
                    var tag = diffNode.parent_interaction_node;
                    var content_node = diffNode.content_node;
                    
                    var $linkToComment = $('<span class="ant_comment_feedback"/>');

                    $linkToComment.append( '<span class="linkToComment">'+ANT.t('thanks_for_comment')+' <a href="javascript:void(0);">'+ANT.t('close')+'</a></span> ');
                    


                    //this broke - for now, just use the quick fix below
                    // $linkToComment.click( function() {
                    //     var selState = content_node.selState || $aWindow.data('selState');
                    //     ANT.actions.viewCommentContent({
                    //         tag:tag,
                    //         hash:hash,
                    //         aWindow:$aWindow,
                    //         content_node:content_node,
                    //         selState:selState
                    //     });
                    //     return false;
                    // });

                    //silly quick way to just trigger the back button
                    $linkToComment.click( function(e) {
                        e.preventDefault();
                        //there's a bug, just close the aWindow for now. 
                        ANT.aWindow.safeClose( $aWindow );
                        // $aWindow.find('.ant_back').eq(0).click();
                    });

                    $aWindow.find('div.ant_commentBox')
                        .empty()
                        .append($linkToComment)
                        .show();

                    $aWindow.find('button.ant_add_comment').hide();

                }


            }//end ANT.aWindow.update
        },
        actionbar: {
            draw: function(settings) {
                //ANT.actionbar.draw:
                //expand to make settings explicit

                //node: summary may not be defined at this point, so get info from settings.
                var hash = settings.hash,
                    coords = settings.coords,
                    kind = settings.kind,
                    content = settings.content,
                    src_with_path = settings.src_with_path || undefined, //used for media only
                    page_id = ANT.util.getPageProperty('id', hash );

                var actionbar_id = "ant_actionbar_"+hash;
                var $actionbars = $('div.ant_actionbar');

                if ( $('#'+actionbar_id).length > 0 ) return $('#'+actionbar_id);
                // else

                // todo: if IE, position higher so we're not behind IE's "Accelerator" arrow
                var actionbarOffsets = {
                    IE: {
                        top: 'add this here',
                        left: 'add this here'
                    },
                    img:  _getMediaCoords, //function below (yeah this is a little weird, make nicer later)
                    text:  {
                        //the extra offsets here move the actionbar above the click - not exact numbers.
                        top: coords.top - 40,  // text actionbar offset.  used to be -33.  tried moving down per CM's feedback at FastCo
                        left: coords.left + 3
                    }
                };

                coords = (kind == 'text') ? actionbarOffsets.text : actionbarOffsets.img(coords);

                // ensure the "actionbar" stays inside the expected space
                // this prevents that errant actionbar thing (well, it's a band-aid)
                if (coords.top < 0 || coords.left < 0) {return false;}

                //todo: for images and video, put the actionbar on the left side if the image is too far right
                // TODO use settings check for certain features and content types to determine which of these to disable
                var $new_actionbar = $('<div class="ant ant_actionbar ant_widget ant_widget_bar" id="' + actionbar_id + '" ></div>');
                $new_actionbar.css({
                   'top':coords.top,
                   'left':coords.left
                });

                //if there is no hash here it will cause problems.  Should always be a hash.
                if(!hash){
                    ANT.safeThrow('There should always be a hash from hashNodes after hover on an unhashed image.');
                    return;
                }
                $new_actionbar.data('hash',hash);
                
                var clickAction = (settings.clickAction) ? settings.clickAction : function() { ANT.aWindow.make( 'writeMode', { "hash": hash, "kind": kind, "content": content, "src_with_path":src_with_path }); };
                var $action = $('<a href="javascript:void(0);" class="ant_tooltip_this">'+
                            '<span class="ant-antenna-logo"></span>'+
                            '<span class="ant ant_react_label">'+ANT.t('main_cta')+'</span>'+
                            // '<div class="ant_down_arrow"></div>'+
                            '<div class="ant_clear"></div>'+
                        '</a><div class="ant_down_arrow"></div>');



                // HOVERTIMER
                $new_actionbar.append( $action );
                $new_actionbar.on('mouseenter.ant', function() {
                    // var $this = $(this);

                    ANT.util.setFunctionTimer( function() { $new_actionbar.addClass('ant_hover'); } , 500);

                    clearTimeout( $new_actionbar.data( 'ant_actionbarShowTimer') );
                }).on('mouseleave.ant', function() {
                    // var $this = $(this);

                    // pause then expand
                    ANT.util.clearFunctionTimer();
                    $new_actionbar.removeClass('ant_hover');

                    // 
                    $new_actionbar.data( 'ant_actionbarShowTimer', setTimeout(function() {
                        // ANT.util.setFunctionTimer( function() { $new_actionbar.addClass('ant_hover'); } , 500);
                        ANT.actionbar.close( $new_actionbar );
                        $('[ant-hash="'+hash+'"]').removeClass('ant_live_hover');
                    }, 1000 ) );

                }).on('click.ant', clickAction );

                $('#ant_sandbox').append( $new_actionbar );
                
                // apply the class in a way that simulates doing so after the append happens.
                // saw on stackoverflow that this should accomplish that.
                setTimeout(function() {
                    $new_actionbar.addClass('ant_show');
                }, 10);


                if(kind == "img" || kind == "media" || kind == "med" ){
                    $new_actionbar.addClass('ant_actionbar_for_media');
                    $new_actionbar.append('<div style="clear:both;" />').removeClass('ant_widget ant_widget_bar');

                    //for now, just move the actionbar here overridding the positioning from above:
                }


                function _getMediaCoords(coords){
                    /*
                    var newCoords = {
                        top: coords.top - 2,
                        left: coords.left + 2
                    };
                    */
                    var $containerTracker = $('#ant_container_tracker_'+hash),
                        $topHilite = $containerTracker.find('.ant_mediaHilite_top');

                    var newCoords = {
                        top: $topHilite.offset().top,
                        left: $topHilite.offset().right
                    };
                    return newCoords;
                }

                return $new_actionbar;

            },
            close: function($actionbars, effect){
                //ANT.actionbar.close:
                $actionbars.each(function(){
                    var $actionbar = $(this),
                        hash = $actionbar.data('hash'),
                        $containerTracker = $('#ant_container_tracker_'+hash);

                    $actionbar.removeClass('ant_show');
                    setTimeout(function() {
                        cleanup($actionbar, hash);
                    }, 200);

                });

                //helper function
                function cleanup($actionbar, hash){
                    var timeoutCloseEvt = $actionbar.data('timeoutCloseEvt');
                    var timeoutCollapseEvt = $actionbar.data('timeoutCollapseEvt');
                    clearTimeout(timeoutCloseEvt);
                    clearTimeout(timeoutCollapseEvt);

                    var $container = $('[ant-hash="'+hash+'"]'),
                        $indicator = $('#ant_indicator_'+hash);

                    $container.removeClass('ant_engage_media');
                    $actionbar.remove();
                }

            },
            closeSuggest: function(hashes) {
                //hashes can be a single hash or a list of hashes
                var $actionbars = $();
                if( !hashes ){
                    $actionbars = $('div.ant_actionbar');
                }
                else
                if(typeof hashes == "string" ){
                    var hash = hashes;
                    $actionbars = $('#ant_actionbar_'+hash);
                    $actionbars.data('hash',hash);
                }
                else{
                    $.each( hashes, function(idx, hash){
                        $actionbars = $actionbars.add('#ant_actionbar_'+hash);
                        $actionbars.data('hash',hash);
                    });
                }

                var scope = this;
                $actionbars.each(function(){
                    var $this = $(this),
                    hash = $actionbars.data('hash'),
                    $indicator_details = $('#ant_indicator_details_'+hash),
                    $containerImg = $('[ant-hash="'+hash+'"]'),
                    timeoutCloseEvt = $(this).data('timeoutCloseEvt');

                    //each actionbar only has one timeout - if one exists, it gets cleared and reset here.
                    clearTimeout(timeoutCloseEvt);
                    timeoutCloseEvt = setTimeout(function(){
                        if( $this.data('hover') || $containerImg.data('hover') || $indicator_details.data('hover') ) return;
                        //else
                        scope.close( $this, "fade");
                    },300);
                    $(this).data('timeoutCloseEvt', timeoutCloseEvt);
                });
            },
            closeAll: function(){
                var $actionbars = $('div.ant_actionbar');
                this.close($actionbars);
            }
        },
        t: function(phrase) {
            return ( typeof ANT.lang[ ANT.group.language ][phrase] != 'undefined' ) ? ANT.lang[ ANT.group.language ][phrase] : '###';
        },
        lang: {
            en : {
                main_cta : 'What do you think?',
                your_reaction : 'Your Reaction?',
                react: 'React',
                add_custom : 'Add Your Own',
                reactions : 'Reactions',
                okay : 'Okay',
                single_reaction : 'reaction',
                plural_reaction : 'reactions',
                to_page : 'to this <strong>page</strong>',
                close : 'Close',
                thanks : 'Thanks For Your Reaction!',
                already_done_that : 'You\'ve already reacted to this',
                remove_reaction : 'Remove reaction',
                view_on_site : 'View at Antenna',
                add_comment : 'Add comments or #hashtags',
                characters_left : 'NNN characters left',
                comment: 'Comment',
                comments: 'Comments',
                thanks_for_comment : 'Thanks for your comment!',
                share_reaction : 'Share your reaction',
                doubleTapMessage : '<strong>Single-tap</strong> any paragraph to respond!',
                bad_language_warning : 'This site has blocked that from being a valid reaction.\n\nPlease try something that will be more appropriate for this community.'
            },
            es : {
                main_cta : '¿Qué piensas?',
                your_reaction : '¿Reacción tuyo?',
                react : 'Reaccionar',
                add_custom : 'Añade lo tuyo',
                reactions : 'Reacciones',
                okay : 'Bien',
                single_reaction : 'reacción',
                plural_reaction : 'reacciones',
                to_page : 'a esta <strong>página</strong>',
                close : 'cerrar',
                thanks : 'Gracias por tu reacción',
                already_done_that : 'Ya reaccionaste a esto',
                remove_reaction : 'Remover reacción',
                view_on_site : 'Ver en Antenna',
                add_comment : 'Añade comentarios o #hashtags',
                characters_left : 'Quedan NNN caracteres ',
                comment: ' Comenta',
                comments: ' Comentas',
                thanks_for_comment : 'Gracias por tu comentario',
                share_reaction : 'Comparte tu reacción',
                doubleTapMessage : '<strong>Toca</strong> un párrafo para opinar',
                bad_language_warning : 'Este sitio ha bloqueado una palabra inadecuada de ser una reacción válida.\n\nPor favor intente algo más apropiado para esta comunidad'
            }
        },
        broadcast: {
            init: function() {
                //ANT.broadcast.init();
                var $broadcastSelector = $(ANT.group.recirc_selector).first();

                if ( ANT.util.activeAB() && ANT.group.show_recirc && $broadcastSelector.length ) {
                    // local debug, use 2878 or 2350 or 2352
                    var ajaxUrl = (ANT_offline) ? "http://www.antenna.is/analytics/recirc/v1/2352/" : ANT_baseUrl+"/analytics/recirc/v1/"+ANT.group.id+"/";
                    $.ajax({
                        // url: ANT_baseUrl+"/analytics/recirc/v1/2878/",
                        // url: ANT_baseUrl+"/analytics/recirc/v1/2350/",
                        // url: ANT_baseUrl+"/analytics/recirc/v1/"+ANT.group.id+"/",
                        url: ajaxUrl,
                        type: "get",
                        contentType: "application/json",
                        dataType: "jsonp",
                        data: {
                            json: $.toJSON( {} )
                        },
                        success: function(response) {
                            var $broadcast = $('<div class="antenna-broadcast no-ant"></div>'),
                                $broadcast_tiles = $('<div class="ant-tiles"></div>'),
                                $broadcast_explanation = $('<div class="ant-explanation"><span class="ant-antenna-logo"></span>Antenna<p>These tiles have reactions from other readers, telling you why certain content caught their attention.</p><p>Add your voice!  React to text, images, and video on the site and your opinion might show up here, too. Just look for the <span class="ant-antenna-logo ant-inline"></span> logo.</p><p>For more information about Antenna, <a href="http://www.antenna.is/">visit our website</a>.</p><p><a href="javascript:void(0);" class="ant-close">Close this</a></p></div>');

                            if ( $broadcastSelector.width() < 400 ) {
                                $broadcast.addClass('ant-thin');
                            }

                            var broadcastHeadline = (ANT.group.recirc_title!='') ? ANT.group.recirc_title:'Popular Reactions';
                            $broadcast.append('<div class="ant-broadcast-header"><div class="ant-headline">'+broadcastHeadline+'</div><div class="ant-logo"><span class="ant-antenna-logo"></span></div></div>');

                            var tileCount = 0;
                            var tiles = [];

                            while(tiles.length < response.data.length){
                              var randomnumber=Math.ceil(Math.random()*response.data.length)
                              var found=false;
                              for(var i=0;i<tiles.length;i++){
                                if(tiles[i]==randomnumber){found=true;break}
                              }
                              if(!found)tiles[tiles.length]=randomnumber;
                            }

                            $.each(tiles, function(idx, tileNum) {
                                var item = response.data[ (tileNum-1) ];
                                if (tileCount < 5) {

                                    var validTile = false;
                                    if (item.content.kind == 'pag') {
                                        if (item.page.image) {
                                            validTile = true;
                                            content = '<img src="'+item.page.image+'" />';
                                        }
                                    } else {
                                        var content = (item.content.kind == 'img') ? '<img src="'+item.content.body+'" />' :
                                                        (item.content.kind == 'med') ? '<iframe class="contentBody" width="250" height="250" frameborder="0" src="'+item.content.body+'"></iframe>' : 
                                                        (item.content.body.split(' ').length < 2 ) ? '':item.content.body;
                                        
                                        // add a bg image to text when the content is too short.  15 characters was picked arbitrailty.
                                        var backgroundImage = (item.content.kind == 'txt' && item.content.body.length < 16) ? item.page.image : '';
                                        validTile = true;
                                    }

                                    if (validTile === true) {
                                        var itemHTML = '' +
                                        '<div class="ant-featured ant-featured-'+item.content.kind+'" style="background-image:url('+backgroundImage+')">' +
                                            '<div class="ant-featured-container">' +
                                                '<a href="//www.antenna.is/r/'+item.reaction.id+'/">' +
                                                  '<div class="ant-featured-content">'+content+'</div>' +
                                                  '<div class="ant-featured-overlay"></div>' +
                                                  '<div class="ant-featured-gradient"></div>' +
                                                  '<div class="ant-featured-reaction">'+item.reaction.body+'</div>' +
                                                  '<div class="ant-featured-headline">'+item.page.title+'</div>' +
                                                '</a>' +
                                            '</div>' +
                                        '</div>';

                                        $broadcast_tiles.append(itemHTML);

                                        tileCount++;
                                    }
                                }
                            });

                            $broadcast.append($broadcast_tiles, $broadcast_explanation);

                            $broadcast.find('.ant-logo, .ant-close').click(function() {
                                $broadcast.find('.ant-explanation').toggleClass('ant-visible');
                            });

                            var broadcastInsertionMethod = ( ANT.group.recirc_jquery_method != "" ) ? ANT.group.recirc_jquery_method : "append";
                            $broadcastSelector[ broadcastInsertionMethod ]( $broadcast );

                            // just to reposition the image/media indicators in case this moves them around
                            ANT.actions.indicators.utils.updateContainerTrackers();
                        }
                    });
                }
            },
            forceDisplay: function(selector) {
                ANT.group.show_recirc = true;
                if (selector) {
                    ANT.group.recirc_selector = selector;
                }
                ANT.broadcast.init();
            }
        },
        status: {
            group: false,
            page: false
        },
        util: {
            cookies: {
                create: function(name,value,days) {
                    if (days) {
                        var date = new Date();
                        date.setTime(date.getTime()+(days*24*60*60*1000));
                        var expires = "; expires="+date.toGMTString();
                    }
                    else var expires = "";
                    document.cookie = name+"="+value+expires+"; path=/";
                },

                read: function(name) {
                    var nameEQ = name + "=";
                    var ca = document.cookie.split(';');
                    for(var i=0;i < ca.length;i++) {
                        var c = ca[i];
                        while (c.charAt(0)==' ') c = c.substring(1,c.length);
                        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
                    }
                    return null;
                },

                erase: function(name) {
                    createCookie(name,"",-1);
                }
            },
            hexToRgb: function(hex) {
                hex = $.trim(hex);
                if (hex) {
                    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
                    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
                    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
                        return r + r + g + g + b + b;
                    });

                    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                    return result ? 
                        parseInt(result[1], 16) + ',' + parseInt(result[2], 16) + ',' + parseInt(result[3], 16)
                    : null;
                } else {
                    return '0,0,0';
                }
            },
            getColorLuma: function(rgb) {
                var r = rgb.split(',')[0],
                    g = rgb.split(',')[1],
                    b = rgb.split(',')[2];

                return 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709
            },
            bubblingEvents: {
                'touchend': false,
                'dragging': false,
                'startX':0,
                'startY':0
            },
            isTouchDragging: function(event) {
                if (!isTouchBrowser) { return false;}
                if (Math.abs(event.originalEvent.changedTouches[0].clientY - ANT.util.bubblingEvents['startY']) > 10 ) {
                    return true;
                } else {
                    return false;
                }
            },
            windowBlur: function() { /*ANT.util.clearWindowInterval();*/ return; },
            windowFocus: function() { return; },
            timerStart:0,
            timerEnd:0,
            clearFunctionTimer: function(timerName) {
                // ANT.util.clearFunctionTimer
                if (!timerName) { timerName = 'ant_functionTimer'};
                clearTimeout($.data(this, timerName));
            },
            setFunctionTimer: function(callback, time, timerName) {
                // ANT.util.setFunctionTimer
                if (!timerName) { timerName = 'ant_functionTimer'};
                ANT.util.clearFunctionTimer(timerName);

                if (!time) { time = 300};
                if (typeof callback != 'undefined') {
                    $.data(this, timerName, setTimeout(function() {
                        callback();
                    }, time));
                }
            },
            clearWindowInterval: function () {
                // clearInterval($.data(this, 'ant_intervalTimer'));
            },
            // setWindowInterval: function () {
                // ANT.util.setWindowInterval
                // $.data(this, 'ant_intervalTimer', setInterval(function() {
                    // if (typeof ANT.events != 'undefined') { ANT.events.checkTime(); }
                // }, 1000));
            // },
            checkForSelectedTextAndLaunchAWindow: function(){
                //ANT.util.checkForSelectedTextAndLaunchAWindow
                    
                //this function is really hacky and gross.
                //But there are functions we want within actionbar that I don't have time to parse out, so just make one in order to click it.


                //will be false if nothing was selected
                var existingSelState = $('document').selog('save');
               
                if(!existingSelState) return;
                //else

                var node = existingSelState.range.commonAncestorContainer

                //if this is a textNode, use the parent, otherwise use this.
                var $node = (node.nodeType === 3) ? $(node).parent() : $(node);

                // var selected = $node.selog('save');
            
                // var hash = $actionbar.data('hash')
                // var kind = 'text';
                // var content = selected.text;

                var $actionbar = ANT.actions.startSelect($node, null, function(hash, kind, content){

                    ANT.aWindow.make( 'writeMode', {
                        "hash": hash,
                        "kind": kind,
                        "content": content
                    });
                });
            },
            initTouchBrowserSettings: function(){
                // ANT.util.initTouchBrowserSettings
                
                // mobiletodo: DO WE NEED
                if(isTouchBrowser && ANT.util.activeAB() ){
                    $(window).on('scrollend.ant', function() {
                        ANT.util.mobileHelperToggle();
                    });
                }

                $ANT.dequeue('initAjax');
            },
            mobileHelperToggle: function() {
                // ANT.util.mobileHelperToggle
                $(ANT.group.active_sections).find('embed[ant-node], video[ant-node], iframe[ant-node], img[ant-node]').each( function() {
                // $(ANT.group.active_sections).find('embed[ant-node], video[ant-node], object[ant-node], iframe[ant-node], img[ant-node]').each( function() {

                    var $this = $(this),
                        hash = $this.data('hash');

                    ANT.actions.indicators.init(hash);
                    $this.addClass('ant_live_hover');
                });

                
            },
            initPublicEvents: function(){
                // ANT.util.initPublicEvents
                //setup a space to bind and trigger events
                //we're using the ant_sandbox which is somewhat arbitrary, but it will work fine and keep things clean.
                window.antenna.public_events = $('#ant_sandbox');
                $ANT.dequeue('initAjax');
            },
            makeEmptySummary : function(hash, kind) {
            // ANT.util.makeEmptySummary( hash )
                var summary = {};
                summary = {};
                summary.hash = hash;
                summary.kind = kind;
                summary.top_interactions = {};
                summary.top_interactions.coms = {};
                summary.top_interactions.tags = {};
                summary.top_interactions.shr = {};
                summary.counts = {};
                summary.counts.tags = 0;
                summary.counts.interactions = 0; // TODO not sure why we have this and also "tags"
                summary.counts.coms = 0;

                return summary;
            },
            getPageProperty: function( prop, hashOrObject ) {
            //ANT.util.getPageProperty

            // goal is, generally, to get the Page ID integer.
                if (!prop) {
                    prop = "id";
                }

                if (prop == "id") {
                    var page_id;

                    //hack to accomodate the dirty - hash=="page"
                    if(hashOrObject == "page"){
                        // hack salvage data
                        page_id = $('.ant_window').data('container').attr('ant-page-id');
                        return parseInt(page_id, 10);
                    }

                    // this code is to accommodate passing in either a hash (string) or jquery element to 
                    if (typeof hashOrObject == "object") {
                        // if ( $(hashOrObject).closest('[ant-page-container]').length && $(hashOrObject).closest('[ant-page-container]').data('page_id') ) {
                        if ( $(hashOrObject).closest('[ant-page-container]').length ) {
                            return parseInt( $(hashOrObject).closest('[ant-page-container]').attr('ant-page-container') );
                        }
                    } else if (!hashOrObject) {
                        // whiskey tango foxtrot
                        // return false;
                        // return $('[ant-page-container]').eq(0).data('page_id');
                        return $('[ant-page-container]').eq(0).attr('ant-page-container');
                    }

                    if ( typeof hashOrObject == "string" ) {
                        var hash = hashOrObject;
                        var $objWithHash = $('[ant-hash="'+hash+'"]');
                    }

                    // do we already have the page_id stored on this element, or do we need to walk up the tree to find one?
                    // so foxtrot ugly
                    var page_id = ( $objWithHash.data('page_id') ) ? $objWithHash.data('page_id') : ( $objWithHash.closest('[ant-page-container]').length ) ? $objWithHash.closest('[ant-page-container]').attr('ant-page-container'):$('body').attr('ant-page-container');

                    // store the page_id on this node to prevent walking-up again later
                    if ( $objWithHash.hasAttr('ant-page-container') && !$objWithHash.data('page_id') ) {
                        $objWithHash.data('page_id', page_id);
                    }
                    return parseInt( page_id );
                }
                if (prop == "title") {
                    var title = $('meta[property="og:title"]').attr('content') ?
                            $('meta[property="og:title"]').attr('content') :
                                $('title').text() ?
                                $('title').text() : "";

                    return $.trim(title);
                }
                

                // what's in the address bar?
                // this is outside the conditional b/c it's referenced by the canonical URL conditional, too
                var page_url = $.trim( window.location.href.split('#')[0] ).toLowerCase();
            
                if (prop == "page_url") {
                    return ANT.actions.removeSubdomainFromPageUrl(page_url);
                }

                // what is the stated canonical?
                if (prop == "canonical_url") {
                    var canonical_url = ( $('link[rel="canonical"]').length > 0 ) ?
                                $('link[rel="canonical"]').attr('href') : page_url;

                    // ant:url overrides
                    if ( $('[property="antenna:url"]').length > 0 ) {
                        canonical_url = $('[property="antenna:url"]').attr('content');
                    }
                    
                    canonical_url = $.trim( canonical_url.toLowerCase() );

                    if (canonical_url == ANT.util.getPageProperty('page_url') ) {
                        canonical_url = "same";
                    }

                    if ( canonical_url !='same' && ANT.util.getPageProperty('page_url').indexOf(canonical_url) == -1 ) {
                        canonical_url = ANT.util.getPageProperty('page_url');
                    }

                    // fastco fix (since they sometimes rewrite their canonical to simply be their TLD.)
                    // in the case where canonical claims TLD but we're actually on an article... set canonical to be the page_url
                    var tld = $.trim(window.location.protocol+'//'+window.location.hostname+'/').toLowerCase();
                    if ( canonical_url == tld ) {
                        if (page_url != tld) {
                            canonical_url = page_url;
                        }
                    }

                    return ANT.actions.removeSubdomainFromPageUrl($.trim(canonical_url));
                }

            },
            buildInteractionData: function() {
                //ANT.util.buildInteractionData
                /*


                In short, the following code blows chunks.
                Can't wait for the MVVC rewrite.

                this just circles through a bunch of crap and rebuilds the ANT.interaction_data object


                */
                $.each( ANT.summaries, function(hash, summary) {
                    $.each( summary.top_interactions.tags, function(tag_id,interaction) {
                        if ( typeof ANT.summaries[ hash ].content_nodes != "undefined" ) {
                            $.each( ANT.summaries[ hash ].content_nodes, function(node_id, node) {
                                if ( typeof node.top_interactions.tags != "undefined" && typeof node.top_interactions.tags[ tag_id ] != "undefined" ) {
                                    var this_interaction = node.top_interactions.tags[ tag_id ];
                                    if ( typeof ANT.interaction_data[ tag_id ] == "undefined" ) {ANT.interaction_data[ tag_id ] = {}; }
                                    if ( typeof ANT.interaction_data[ tag_id ][ this_interaction.parent_id ] == "undefined" ) { ANT.interaction_data[ tag_id ][ this_interaction.parent_id ] = {}; }
                                    ANT.interaction_data[ tag_id ][ this_interaction.parent_id ].hash = hash;
                                    ANT.interaction_data[ tag_id ][ this_interaction.parent_id ].container_id = summary.id;
                                    ANT.interaction_data[ tag_id ][ this_interaction.parent_id ].tag = { body:this_interaction.body, id:tag_id};
                                    ANT.interaction_data[ tag_id ][ this_interaction.parent_id ].kind = summary.kind;
                                    
                                    // this content node's content, location is what we want
                                    ANT.interaction_data[ tag_id ][ this_interaction.parent_id ].interaction = { id:this_interaction.parent_id, count:this_interaction.count, body:this_interaction.body};
                                    ANT.interaction_data[ tag_id ][ this_interaction.parent_id ].content_node = { body:node.body, location:node.location, selState:node.selState };
                                }
                            });
                        }
                    });
                });
            },
            stayInWindow: function($aWindow, animate) {
                var animate = false;
                //ANT.util.stayInWindow:
                if (isMobile) { return; }
               var rWin = $(window),
                    winWidth = rWin.width(),
                    winHeight = rWin.height(),
                    winScroll = rWin.scrollTop(),
                    aWinOffsets = $aWindow.offset(),
                    aWinTop = aWinOffsets.top,
                    aWinLeft = aWinOffsets.left,
                    aWinRight = aWinOffsets.right,
                    aWinWidth = $aWindow.width(),
                    aWinHeight = $aWindow.height();
                    // coords = settings.coords,
                    // paddingY = settings.paddingY || 10,
                    // paddingX = settings.paddingX || 10,
                    // ignoreWindowEdges = (settings.ignoreWindowEdges) ? settings.ignoreWindowEdges:""; // ignoreWindowEdges - check for index of t, r, b, l


                    var aWin_bottom_difference = (aWinHeight + aWinTop) - (winHeight + winScroll);

                            if ( aWin_bottom_difference > 0 ) {
                                if (animate) {
                                    $aWindow.animate({'top': aWinTop - aWin_bottom_difference },333 );
                                } else {
                                    $aWindow.css('top', aWinTop - aWin_bottom_difference );
                                }
                                
                            }

                    var aWin_right_difference = (aWinRight) - winWidth;

                            if ( aWin_right_difference > 0 ) {
                                if (animate) {
                                    $aWindow.animate({'left': aWinLeft - aWin_right_difference},333 );
                                } else {
                                    $aWindow.css('left', aWinLeft - aWin_right_difference );
                                }
                            }

                            if ( aWinLeft < 0 ) {
                                $aWindow.css('left', '0px' );
                            }
                    return; 

            },
            md5: {
                hexcase:0,
                b64pad:"",
                chrsz:8,
                hex_md5: function(s){return ANT.util.md5.binl2hex(ANT.util.md5.core_md5(ANT.util.md5.str2binl(s),s.length*ANT.util.md5.chrsz));},
                core_md5: function(x,len){x[len>>5]|=0x80<<((len)%32);x[(((len+64)>>>9)<<4)+14]=len;var a=1732584193;var b=-271733879;var c=-1732584194;var d=271733878;for(var i=0;i<x.length;i+=16){var olda=a;var oldb=b;var oldc=c;var oldd=d;a=ANT.util.md5.md5_ff(a,b,c,d,x[i+0],7,-680876936);d=ANT.util.md5.md5_ff(d,a,b,c,x[i+1],12,-389564586);c=ANT.util.md5.md5_ff(c,d,a,b,x[i+2],17,606105819);b=ANT.util.md5.md5_ff(b,c,d,a,x[i+3],22,-1044525330);a=ANT.util.md5.md5_ff(a,b,c,d,x[i+4],7,-176418897);d=ANT.util.md5.md5_ff(d,a,b,c,x[i+5],12,1200080426);c=ANT.util.md5.md5_ff(c,d,a,b,x[i+6],17,-1473231341);b=ANT.util.md5.md5_ff(b,c,d,a,x[i+7],22,-45705983);a=ANT.util.md5.md5_ff(a,b,c,d,x[i+8],7,1770035416);d=ANT.util.md5.md5_ff(d,a,b,c,x[i+9],12,-1958414417);c=ANT.util.md5.md5_ff(c,d,a,b,x[i+10],17,-42063);b=ANT.util.md5.md5_ff(b,c,d,a,x[i+11],22,-1990404162);a=ANT.util.md5.md5_ff(a,b,c,d,x[i+12],7,1804603682);d=ANT.util.md5.md5_ff(d,a,b,c,x[i+13],12,-40341101);c=ANT.util.md5.md5_ff(c,d,a,b,x[i+14],17,-1502002290);b=ANT.util.md5.md5_ff(b,c,d,a,x[i+15],22,1236535329);a=ANT.util.md5.md5_gg(a,b,c,d,x[i+1],5,-165796510);d=ANT.util.md5.md5_gg(d,a,b,c,x[i+6],9,-1069501632);c=ANT.util.md5.md5_gg(c,d,a,b,x[i+11],14,643717713);b=ANT.util.md5.md5_gg(b,c,d,a,x[i+0],20,-373897302);a=ANT.util.md5.md5_gg(a,b,c,d,x[i+5],5,-701558691);d=ANT.util.md5.md5_gg(d,a,b,c,x[i+10],9,38016083);c=ANT.util.md5.md5_gg(c,d,a,b,x[i+15],14,-660478335);b=ANT.util.md5.md5_gg(b,c,d,a,x[i+4],20,-405537848);a=ANT.util.md5.md5_gg(a,b,c,d,x[i+9],5,568446438);d=ANT.util.md5.md5_gg(d,a,b,c,x[i+14],9,-1019803690);c=ANT.util.md5.md5_gg(c,d,a,b,x[i+3],14,-187363961);b=ANT.util.md5.md5_gg(b,c,d,a,x[i+8],20,1163531501);a=ANT.util.md5.md5_gg(a,b,c,d,x[i+13],5,-1444681467);d=ANT.util.md5.md5_gg(d,a,b,c,x[i+2],9,-51403784);c=ANT.util.md5.md5_gg(c,d,a,b,x[i+7],14,1735328473);b=ANT.util.md5.md5_gg(b,c,d,a,x[i+12],20,-1926607734);a=ANT.util.md5.md5_hh(a,b,c,d,x[i+5],4,-378558);d=ANT.util.md5.md5_hh(d,a,b,c,x[i+8],11,-2022574463);c=ANT.util.md5.md5_hh(c,d,a,b,x[i+11],16,1839030562);b=ANT.util.md5.md5_hh(b,c,d,a,x[i+14],23,-35309556);a=ANT.util.md5.md5_hh(a,b,c,d,x[i+1],4,-1530992060);d=ANT.util.md5.md5_hh(d,a,b,c,x[i+4],11,1272893353);c=ANT.util.md5.md5_hh(c,d,a,b,x[i+7],16,-155497632);b=ANT.util.md5.md5_hh(b,c,d,a,x[i+10],23,-1094730640);a=ANT.util.md5.md5_hh(a,b,c,d,x[i+13],4,681279174);d=ANT.util.md5.md5_hh(d,a,b,c,x[i+0],11,-358537222);c=ANT.util.md5.md5_hh(c,d,a,b,x[i+3],16,-722521979);b=ANT.util.md5.md5_hh(b,c,d,a,x[i+6],23,76029189);a=ANT.util.md5.md5_hh(a,b,c,d,x[i+9],4,-640364487);d=ANT.util.md5.md5_hh(d,a,b,c,x[i+12],11,-421815835);c=ANT.util.md5.md5_hh(c,d,a,b,x[i+15],16,530742520);b=ANT.util.md5.md5_hh(b,c,d,a,x[i+2],23,-995338651);a=ANT.util.md5.md5_ii(a,b,c,d,x[i+0],6,-198630844);d=ANT.util.md5.md5_ii(d,a,b,c,x[i+7],10,1126891415);c=ANT.util.md5.md5_ii(c,d,a,b,x[i+14],15,-1416354905);b=ANT.util.md5.md5_ii(b,c,d,a,x[i+5],21,-57434055);a=ANT.util.md5.md5_ii(a,b,c,d,x[i+12],6,1700485571);d=ANT.util.md5.md5_ii(d,a,b,c,x[i+3],10,-1894986606);c=ANT.util.md5.md5_ii(c,d,a,b,x[i+10],15,-1051523);b=ANT.util.md5.md5_ii(b,c,d,a,x[i+1],21,-2054922799);a=ANT.util.md5.md5_ii(a,b,c,d,x[i+8],6,1873313359);d=ANT.util.md5.md5_ii(d,a,b,c,x[i+15],10,-30611744);c=ANT.util.md5.md5_ii(c,d,a,b,x[i+6],15,-1560198380);b=ANT.util.md5.md5_ii(b,c,d,a,x[i+13],21,1309151649);a=ANT.util.md5.md5_ii(a,b,c,d,x[i+4],6,-145523070);d=ANT.util.md5.md5_ii(d,a,b,c,x[i+11],10,-1120210379);c=ANT.util.md5.md5_ii(c,d,a,b,x[i+2],15,718787259);b=ANT.util.md5.md5_ii(b,c,d,a,x[i+9],21,-343485551);a=ANT.util.md5.safe_add(a,olda);b=ANT.util.md5.safe_add(b,oldb);c=ANT.util.md5.safe_add(c,oldc);d=ANT.util.md5.safe_add(d,oldd);} return Array(a,b,c,d);},
                md5_cmn: function(q,a,b,x,s,t){return ANT.util.md5.safe_add(ANT.util.md5.bit_rol(ANT.util.md5.safe_add(ANT.util.md5.safe_add(a,q),ANT.util.md5.safe_add(x,t)),s),b);},
                md5_ff: function(a,b,c,d,x,s,t){return ANT.util.md5.md5_cmn((b&c)|((~b)&d),a,b,x,s,t);},
                md5_gg: function(a,b,c,d,x,s,t){return ANT.util.md5.md5_cmn((b&d)|(c&(~d)),a,b,x,s,t);},
                md5_hh: function(a,b,c,d,x,s,t){return ANT.util.md5.md5_cmn(b^c^d,a,b,x,s,t);},
                md5_ii: function(a,b,c,d,x,s,t){return ANT.util.md5.md5_cmn(c^(b|(~d)),a,b,x,s,t);},
                safe_add: function(x,y){var lsw=(x&0xFFFF)+(y&0xFFFF);var msw=(x>>16)+(y>>16)+(lsw>>16);return(msw<<16)|(lsw&0xFFFF);},
                bit_rol: function(num,cnt){return(num<<cnt)|(num>>>(32-cnt));},
                //the line below is called out by jsLint because it uses Array() instead of [].  We can ignore, or I'm sure we could change it if we wanted to.
                str2binl: function(str){var bin=Array();var mask=(1<<ANT.util.md5.chrsz)-1;for(var i=0;i<str.length*ANT.util.md5.chrsz;i+=ANT.util.md5.chrsz){bin[i>>5]|=(str.charCodeAt(i/ANT.util.md5.chrsz)&mask)<<(i%32);}return bin;},
                binl2hex: function(binarray){var hex_tab=ANT.util.md5.hexcase?"0123456789ABCDEF":"0123456789abcdef";var str="";for(var i=0;i<binarray.length*4;i++){str+=hex_tab.charAt((binarray[i>>2]>>((i%4)*8+4))&0xF)+hex_tab.charAt((binarray[i>>2]>>((i%4)*8))&0xF);} return str;}
            },
            getCleanText: function($domNode) {
                // ANT.util.getCleanText
                // common function for cleaning the text node text.  right now, it's removing spaces, tabs, newlines, and then double spaces
                
                var $node = $domNode.clone();

                $node.find('.ant, .ant-custom-cta-container').remove();

                //make sure it doesnt alredy have in indicator - it shouldn't.
                var $indicator = $node.find('.ant_indicator');
                if($indicator.length){
                    //todo: send us an error report - this may still be happening for slideshows.
                    //This fix works fine, but we should fix the code to handle it before here.
                    return;
                }
                
                // get the node's text and smash case
                // TODO: <br> tags and block-level tags can screw up words.  ex:
                // hello<br>how are you?   here becomes
                // hellohow are you?    <-- no space where the <br> was.  bad.
                var node_text = $.trim( $node.html().replace(/< *br *\/?>/gi, ' ') );
                var body = $.trim( $( "<div>" + node_text + "</div>" ).text().toLowerCase() );

                if( body && typeof body == "string" && body !== "" ) {
                    var firstpass = body.replace(/[\n\r\t]+/gi,' ').replace().replace(/\s{2,}/g,' ');
                    // seeing if this helps the propub issue - to trim again.  When i run this line above it looks like there is still white space.
                    return $.trim(firstpass);
                }
            },
            trimToLastWord: function(str){
                var danglerRE = /\w+$/.exec(str);
                if( !danglerRE){
                    return str;
                }
                else{
                    return str.slice(0, str.length-danglerRE[0].length);
                }
            },
            cssSuperImportant: function($domNode, cssDict, shouldReplace){
                //ANT.util.cssSuperImportant:
                //todo: this needs improvement - it should be parsing the style into a dict and then checking for an existing style to override.
                var inlineStyleStr = "";

                $.each(cssDict,function(key,val){
                    //remove and then add to make sure we're not double adding it
                    val.replace('!important', "");
                    $.trim(val);
                    val += " !important";
                    cssDict[key] = val;
                });

                var existingStyle = $domNode.attr('style') || "";
                var newStyleDict = shouldReplace ? 
                    cssDict : 
                    $.extend( 
                        ANT.util.parseCssAttrToDict( existingStyle ),
                        cssDict
                    );

                $.each(newStyleDict,function(key,val){
                    inlineStyleStr += (key+ ':' +val+";");
                });
                $domNode.attr('style', inlineStyleStr);
                return $domNode; //return the node for the hell of it.
            },
            parseCssAttrToDict: function(inlineStyleStr){
                //ANT.util.parseCssAttrToDict:
                var styleDict = {};
                var attrs = inlineStyleStr.split(';');
                $.each(attrs,function(idx, attrPair){
                    var attrSplit = attrPair.split(':');
                    var key = $.trim(attrSplit[0]);
                    var val = $.trim(attrSplit[1]);
                    if(key.length && val.length){
                        styleDict[ key ] = val;
                    }
                });
                return styleDict;
            },
            
            fixBrTags: function(){
                // ANT.util.fixBrTags:

                //find the $sections through br tags that are in the scoped section.
                var $sections = $(ANT.group.br_replace_scope_selector).find('> br').parent();

                if(!$sections.length){
                    return;
                }
                //arbitrary unique string
                var marker = "|ant|br|/ant|";

                $sections.each(function(){
                    //clone it to manipulate outside the dom
                    var $this = $(this);
                    var $clone = $this.clone();
                    var $dummySection = $('<p></p>');

                    //use jquery's parser not regex to find <br> tags (http://bit.ly/3x9sQX)
                    $clone.find('> br').each(function(){
                        $(this).replaceWith(marker);
                    });
                    var sections = $clone.html().split(marker);
                    
                    for(var i = 0; i < sections.length; i++) {
                        var innerText = sections[i];
                        
                        //use a div rarely-used html5 element as a conveninent wrapper
                        //http://www.quackit.com/html_5/tags/html_rt_tag.cfm
                        // update:  no, dont.  running into CSS and browser support issues.
                        $dummySection.append('<div class="ant_br_replaced">'+innerText+'</div>');
                    }

                    $this
                      .addClass('ant_br_replaced_section')
                      .html($dummySection.html());
                });
            },

            fixBodyBorderOffsetIssue: function(){
                //ANT.util.fixBodyBorderOffsetIssue:
                //a fix for the rare case where the body element has a border on it.
                //this is needed because jQuery's offset doesn't account for that.
                //suposedly it also doesn't account for margin or padding on the body, but a fix for those doesnt' seem to be needed.

                //todo: this works fine for now - makes the indicators look right on hypervocal,
                    //but there is still a little functionality outside the sandbox that should be incorporated into this fix.
                    //for example - the stay-in-window function doesn't compensate for the body border, but it doens't matter for a small border anyway.

                var $body = $('body'),
                    borderTop = parseInt( $body.css('border-top-width'), 10 ),
                    borderLeft = parseInt( $body.css('border-left-width'), 10 ),
                    $sandbox = $('#ant_sandbox');

                if( !borderTop && !borderLeft ) return;
                //else

                ANT.util.cssSuperImportant($sandbox, {
                    top: borderTop+'px',
                    left: borderLeft+'px'
                });

            },
            //_.throttle returns a function
            throttledUpdateContainerTrackers: function(){

                return ANT.util._.throttle(
                    //ANT.util.throttledUpdateContainerTrackers
                    ANT.actions.indicators.utils.updateContainerTrackers,
                    100
                );
            },
            userLoginState: function() {
                //ANT.util.userLoginState
                if ( !$('#ant-user').length ) {
                    $('.ant-page-summary').find('div.ant-summary').prepend('<div id="ant-user" />');
                }
                if ( ANT && ANT.user && ANT.user.full_name && $('.ant-page-summary.defaultSummaryBar').length ) {
                    var name = (ANT.user.user_type == "facebook") ? ( ANT.user.full_name.split(' ')[0] ) : ANT.user.full_name;
                    $('#ant-user').html('Hi, <a href="'+ANT_baseUrl+'/user/'+ANT.user.user_id+'" target="_blank">'+name+'</a>');
                } else {
                    // no t()
                    $('#ant-user').html('<a href="javascript:void(0);">Log in to Antenna</a>');
                    $('#ant-user').find('a').click( function() { ANT.session.showLoginPanel(); } );
                }
            },

            objLength: function(obj) {
                // ANT.util.objLength:
                // returns the length of an object
                var size = 0, key;
                for (key in obj) {
                    if (obj.hasOwnProperty(key)){
                        size++;
                    }
                }
                return size;
            },

            //temp copies of some underscore functions.  Later we'll use the underscore library - replace then.
            _: {
                //ANT.util._:
            
                // Returns a function, that, as long as it continues to be invoked, will not
                // be triggered. The function will be called after it stops being called for
                // N milliseconds.
                debounce: function(func, wait) {
                    //ANT.util._.debounce:
                    var timeout;
                    return function() {
                        var context = this, args = arguments;
                        var later = function() {
                            timeout = null;
                            func.apply(context, args);
                        };
                        clearTimeout(timeout);
                        timeout = setTimeout(later, wait);
                    };
                },

                // Returns a function, that, when invoked, will only be triggered at most once
                // during a given window of time.
                throttle: function(func, wait) {
                    //ANT.util._.throttle:

                    //fake the underscore stuff
                    var _ = {};
                    _.debounce = ANT.util._.debounce;

                    var context, args, timeout, throttling, more;
                    var whenDone = _.debounce(function(){ more = throttling = false; }, wait);
                    return function() {
                        context = this; args = arguments;
                        var later = function() {
                            timeout = null;
                            if (more) func.apply(context, args);
                            whenDone();
                        };
                        if (!timeout) timeout = setTimeout(later, wait);
                        if (throttling) {
                            more = true;
                        } else {
                            func.apply(context, args);
                        }
                        whenDone();
                        throttling = true;
                    };
                },
                once: function(func) {
                    //ANT.util._.once:
                    var ran = false, memo;
                    return function() {
                        if (ran) return memo;
                        ran = true;
                        memo = func.apply(this, arguments);
                        func = null;
                        return memo;
                    };
                }
            },
            getQueryParams: function(optQueryString) {
                //ANT.util.getQueryParams:

                //thanks: http://stackoverflow.com/a/2880929/1289255
                //I haven't verfied that this is 100% perfect for every url case, but it's solid.
                
                //this function is also in ant_scripts
                var queryString = optQueryString || window.location.search;

                var urlParams = {};
                var e,
                a = /\+/g,  // Regex for replacing addition symbol with a space
                r = /([^&=]+)=?([^&]*)/g,
                d = function (s) { return decodeURIComponent(s.replace(a, " ")); },
                q = queryString.substring(1);

                while (e = r.exec(q))
                    urlParams[d(e[1])] = d(e[2]);

                return urlParams;
            },
            getQueryStrFromUrl: function(url){
                var qIndex = url.indexOf('?'),
                    hrefBase,
                    hrefQuery,
                    qParams;

                 //if qIndex == -1, there was no ?
                if(qIndex == -1 ) {
                    hrefBase = url;
                    hrefQuery = "";
                }else{
                    hrefBase = url.slice(0, qIndex);
                    hrefQuery = url.slice(qIndex);
                }
                return hrefQuery;
            },
            createGuid: function() {
                //ANT.util.createGuid
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            },
            killSessions: function() {
                //ANT.util.killSessions
                localStorage.removeItem('ant_sts');
                localStorage.removeItem('ant_lts');
                ANT.user.sts = null;
                ANT.user.lts = null;
            },
            activeAB: function() {
                //ANT.util.activeAB

                // Disabling A/B testing  :)
                return true;

                var isActive = true;
                var ant_ab = JSON.parse( localStorage.getItem('ant_ab') );  // ab test candidate.  true = sees Antenna

                if( ANT.group.ab_test_impact === true && (typeof ANT.group.ab_value!='undefined' || !ant_ab || new Date().getTime() > ant_ab.expires) ) {
                    // calculate whether or not they are in the active pool
                    var p=(10*ANT.group.ab_test_sample_percentage); // multiply 10, so 2.5 or 0.5 can be tested

                    // generate a random number.  if the number is lower than P, they will NOT see the widget
                    if ( Math.floor(Math.random() * 1000 ) <= p ) {
                        isActive = false;
                    }

                    if (typeof ANT.group.ab_value!='undefined') {
                        isActive = (ANT.group.ab_value === 'a');
                    }
                    

                    // set time for 'cookie' to expire
                    var ab_session_expiretime = new Date();
                    var days = 30;
                    ab_session_expiretime.setTime(ab_session_expiretime.getTime() + (days * 1440 * 60 * 1000));

                    var new_ant_ab = {active: isActive, expires: ab_session_expiretime.getTime() }
                    localStorage.setItem('ant_ab', JSON.stringify(new_ant_ab) );
                } else {
                    isActive = ant_ab.active;
                }

                return isActive;
            },
            checkSessions: function() {
                //ANT.util.checkSessions
                var ant_sts = JSON.parse( localStorage.getItem('ant_sts') );  // short term session
                var ant_lts = localStorage.getItem('ant_lts'); // long term session

                // check/set session localStorages
                if( !ant_sts || new Date().getTime() > ant_sts.expires ) {
                    var short_session_guid = ANT.user.sts = ANT.util.createGuid();
                    var short_session_expiretime = new Date();
                    var minutes = 15;
                    short_session_expiretime.setTime(short_session_expiretime.getTime() + (minutes * 60 * 1000));

                    var new_ant_sts = {guid: short_session_guid, expires: short_session_expiretime.getTime() }
                    localStorage.setItem('ant_sts', JSON.stringify(new_ant_sts) );
                    
                    // $.clog('rs sts 1', short_session_guid );
                    // $.cookie('ant_sts', short_session_guid, { expires: short_session_expiretime });
                } else {

                    ANT.user.sts = ant_sts.guid;

                    // lets extend the session time 
                    var minutes = 10;
                    var short_session_expiretime = new Date();
                    short_session_expiretime.setTime(short_session_expiretime.getTime() + (minutes * 60 * 1000));
                    // $.clog('rs sts 2', ANT.user.sts );
                    // $.cookie('ant_sts', ANT.user.sts, { expires: short_session_expiretime });

                    var new_ant_sts = {guid: ANT.user.sts, expires: short_session_expiretime.getTime() }
                    localStorage.setItem('ant_sts', JSON.stringify(new_ant_sts) );
                }

                if( !ant_lts ) {
                    var long_session_guid = ANT.user.lts = ANT.util.createGuid();
                    // var long_session_expiretime = new Date();
                    // var days = 180;
                    // long_session_expiretime.setTime(long_session_expiretime.getTime() + (days * 60 * 1000 * 60 * 24));
                    // $.clog('rs lts 1', long_session_guid ); 
                    // $.cookie('ant_lts', long_session_guid, { expires: long_session_expiretime });

                    // var new_ant_lts = {guid: long_session_guid, expires: short_session_expiretime }
                    localStorage.setItem('ant_lts', long_session_guid );
                } else {
                    ANT.user.lts = ant_lts;
                    // $.clog('rs lts 2', ANT.user.lts ); 

                    //////////// buggy when i reset this cookie's time, too, so not doing it for now::::
                    // lets extend the session time 
                    // var days = 180;
                    // var long_session_expiretime = new Date();
                    // long_session_expiretime.setTime(long_session_expiretime.getTime() + (days * 60 * 1000 * 60 * 24));
                    // $.cookie('ant_lts', ANT.user.long_session_guid, { expires: long_session_expiretime });
                }
            }
        },
        debug: function(){
            window.ANT = window.ANTENNAIS;
            window.$ANT = $ANT;
            window.$A = $A;
        },
        toggle: function(){
            $A('body').toggleClass('no-ant');
        },
        getLastEvent: function() {
            // if (ANT.group.premium == true) {
                return {
                    'event':(ANT.events.lastEvent) ? ANT.events.lastEvent:'',
                    'value':(ANT.events.lastValue) ? ANT.events.lastValue:'',
                    'supplementary':(ANT.events.lastSupplementary) ? ANT.events.lastSupplementary:{}
                };
            // }
        },
        session: {
            alertBar: {
                make: function( whichAlert, data) {
                    // ANT.session.alertBar.make:
                    //whichAlert to tell us if it's the educate user bar, or the sharedLink bar
                    //data if we want it, not using it now... - expects:
                    /*
                    data = {
                        location: "2:16\0542:90{ed6a0863}",
                        container_hash: 'c9676b4da28e1e005a1b27676e8b2847'
                    }
                    */

                    //todo: finish making these changes here:, but i didnt' want to do it before the DC demo.
                    var $msg1, $msg2, $pinIcon;


                    if( whichAlert == "fromShareLink" && data.content != "undefined" ){
                        var decodedContent = unescape($.evalJSON('"'+data.content+'"'));

                        // recirc tracker USED to be here

                        $msg1 = $('<h1>Shared with <span>Antenna</span></h1>');

                        if ( $('img[ant-hash="'+data.container_hash+'"]').length == 1 ) {
                            $msg2 = $('<div><strong class="reactionText">'+ANT.t('single_reaction')+': <em>' + data.reaction + '</em></strong>'+
                                ' <a class="ant_showSelection" href="javascript:void(0);"><img src="' + data.content + '" style="max-width:100px !important;max-height:70px !important;margin:5px 0 !important;display:block !important;" />'+
                                ' <strong class="seeItLinkText ant_blue">Show it on the page</strong></a></div>');
                        } else {
                            //put a better message here
                            $msg2 = $('<div><strong class="reactionText">'+ANT.t('single_reaction')+': <em>' + data.reaction + '</em></strong>'+
                                '<strong>"</strong><em>' + decodedContent.substr(0,140) + '...</em><strong>"</strong>'+
                                '<br /><strong class="seeItLinkText"><a class="ant_showSelection" href="javascript:void(0);">Show it on the page</a></strong></div>');
                        }
                        $msg2.find('a.ant_showSelection').click( function() {
                            //show the alertBar sliding closed for just a second before scrolling down..
                            // ANT.session.alertBar.close();
                            setTimeout(function(){
                                ANT.session.revealSharedContent(data);
                            }, 200);
                        });
                    }
                    // if( whichAlert == "showMorePins"){
                    //     //put a better message here
                    //     // not translated b/c we're not really using.
                    //     $msg1 = $('<h1>See <span>more reactions</span> on this page.</h1>');
                    //     $msg2 = $('<div>Readers like you are reacting to, sharing, and discussing content on this page.  <a class="ant_show_more_pins" href="javascript:void(0);">Click here</a> to see what they\'re saying.<br><br><strong>Tip:</strong> Look for the <span class="ant-antenna-logo"></span> icons.</div>');

                    //     $msg2.find('a.ant_show_more_pins').click( function() {
                    //         ANT.actions.summaries.showLessPopularIndicators();
                    //         $(this).closest('div.ant_alert_box').find('div.ant_alert_box_x').click();
                    //     });
                    // }
                    if (typeof $msg1 != "undefined" ) {
                        $pinIcon = $('<span class="ant-antenna-logo"></span>');

                        var $alertContent = $('<div class="ant_alert_box ant ant_' + whichAlert + '" />');

                        $alertContent.append(
                            $('<div class="ant_alert_box_1" />').append($pinIcon).append($msg1),
                            $('<div class="ant_alert_box_2" />').append($msg2),
                            '<div class="ant ant_alert_box_x">x</div>'
                        );

                        $('#ant_sandbox').append( $alertContent );
                        $('div.ant_alert_box.ant_'+whichAlert).find('.ant_alert_box_x').click( function() {
                            ANT.session.alertBar.close( whichAlert );
                        });

                        // TODO put this back in
                        $('div.ant_alert_box.ant_'+whichAlert).animate({top:-5},1000);
                    }
                },
                close: function( whichAlert ) {
                    //ANT.session.alertBar.close:
                    $('div.ant_alert_box.ant_'+whichAlert).remove();

                    //brute force for now -
                    //if they click the X we need this;
                    $('div.ant_indicator_for_media').hide();
                    
                    // set a localStorage in the iframe saying not to show this anymore
                    $.postMessage(
                        "close "+whichAlert,
                        ANT_baseUrl + "/static/xdm.html",
                        window.frames['ant-xdm-hidden']
                    );
                }
            },
            revealSharedContent: function(data){
                var hash = data.container_hash,
                    $container = $('[ant-hash="'+hash+'"]');

                var kind = $container.data('kind');

                if(kind == 'img' || kind == 'media' || kind == 'med'){
                    $container.addClass('ant_shared');
                    ANT.actions.indicators.utils.updateContainerTracker(hash);
                    // ANT.actions.indicators.utils.borderHilites.engage(hash, true);
                }

                if ( data.location && data.location != "None" ) {


                    var serialRange = data.location;

                    var selogStack = $().selog('stack'); //just fyi, not using it... Will be an empty stack on page load.

                    var selState = $container.selog('save', {'serialRange':serialRange} );
                    $().selog('hilite', selState, 'on');

                    $('div.ant_page_summary').remove();
                }

                var targetOffset = $container.offset().top,
                windowPadding = 130,
                scrollTarget = targetOffset-windowPadding || 0;

                $('html,body').animate({scrollTop: scrollTarget}, 1000);
            },
            getSharedLinkInfo: function( data ){
                //some condition

                //TODO: sample data here, fill with info from localStorage
                // var data = {
                //     location: "2:10\0542:32",
                //     container_hash: "c9676b4da28e1e005a1b27676e8b2847"
                // }

                //note: I turned off the checksum in rangy, so the locations will be mising the {####} part.
                // we don't need the checksum, cause we're already doing that.

                //note: the "\054" is actually the octal for a comma.  The back end is passing it back that way. It's working fine though.
                //, so it seems that "2:10\0542:32" == "2:10,2:32"
                if ( ANT.util.cookies.read('content_type') != 'pag' ) {
                    
                    // quick fix
                    // todo  - do this better later;
                    var containerHash = data.container_hash;
                    var pageHasContainer = !! ANT.containers[containerHash];
                    if (!pageHasContainer){
                        return;
                    }
                    
                    ANT.session.alertBar.make('fromShareLink', data);
                    return true; //could return something more useful if we need it.
                }
            },
            getUser: function(args, callback) {
                //ANT.session.getUser
                if ( callback && args ) {
                    ANT.session.receiveMessage( args, callback );
                } else if ( callback ) {
                    ANT.session.receiveMessage( false, callback );
                }
                $.postMessage(
                    "getUser",
                    ANT_baseUrl + "/static/xdm.html",
                    window.frames['ant-xdm-hidden']
                );
            },
            handleGetUserFail: function(args, callback) {
                var response = args.response;

                switch ( response.message ) {
                    case "Error getting user!":
                        // kill the user object and localStorage
                        ANT.session.killUser();
                        // TODO tell the user something failed and ask them to try again
                        // pass callback into the login panel
                    break;

                    case "Temporary user interaction limit reached":
                        // TODO: something.  anything at all.
                        ANT.session.showLoginPanel( args, callback );
                    break;
                    case "Container specified does not exist":
                    break;

                    case "Token was invalid":
                    case "Facebook token expired":  // call fb login
                    case "FB graph error - token invalid":  // call fb login
                    case "Social Auth does not exist for user": // call fb login
                    case "Data to create token is missing": // call fb login
                        if ( typeof ANT.user.user_type != "undefined" && ANT.user.user_type == "antenna") {
                            ANT.session.showLoginPanel( args, callback );
                        } else {
                            // ANT.session.showLoginPanel( args, callback ); is untested, just seeing if it can handle blocked FB popups.
                            ANT.user.getUserAttempts = ANT.user.getUserAttempts || 1;
                            if ( ANT.user.getUserAttempts < 2 ) {
                                // the token is out of sync.  could be a mistake or a hack.
                                ANT.session.receiveMessage( args, callback );
                                // ANT.session.showLoginPanel( args, callback );
                                $.postMessage(
                                    "reauthUser",
                                    // "killUser",
                                    ANT_baseUrl + "/static/xdm.html",
                                    window.frames['ant-xdm-hidden']
                                );
                            } else {
                                ANT.session.killUser();
                                ANT.session.showLoginPanel( args, callback );
                            }
                        }

                        // // init a new receiveMessage handler to fire this callback if it's successful
                    break;
                }
            },
            createXDMframe: function() {
                ANT.session.receiveMessage({}, function() {
                    ANT.util.userLoginState();
                });

                var iframeUrl = ANT_baseUrl + "/static/xdm.html",
                parentUrl = window.location.href,
                parentHost = window.location.protocol + "//" + window.location.host,
                bookmarklet = ( ANT.engageScriptParams.bookmarklet ) ? "bookmarklet=true":"",
                $xdmIframe = $('<iframe id="ant-xdm-hidden" name="ant-xdm-hidden" src="' + iframeUrl + '?parentUrl=' + parentUrl + '&parentHost=' + parentHost + '&group_id='+ANT.group.id+'&group_name='+encodeURIComponent(ANT.group.name)+'&'+bookmarklet+'" width="1" height="1" style="position:absolute;top:-1000px;left:-1000px;" />'
                );
                $('#ant_sandbox').append( $xdmIframe );

                // this is the postMessage receiver for ALL messages posted.
                // TODO: put this elsewhere so it's more logically placed and easier to find??

                $ANT.dequeue('initAjax');
            },
            receiveMessage: function(args, callbackFunction) {
                //ANT.session.receiveMessage
                //args is passed through this function into the callback as a parameter.
                //The only side effect is that it adds a user property to args ( args[user] ).
                $.receiveMessage(
                    function(e){
                        var message = $.evalJSON( e.data );
                        
                        if ( message.status ) {
                            if ( message.status == "returning_user" || message.status == "got_temp_user" ) {
                                // currently, we don't care HERE what user type it is.  we just need a user ID and token to finish the action
                                // the response of the action itself (say, tagging) will tell us if we need to message the user about temp, log in, etc

                                for ( var i in message.data ) {
                                    ANT.user = ANT.user || {};
                                    if ( i == "user_boards" ) {
                                        ANT.user.user_boards = $.evalJSON( message.data[i] );
                                    } else {
                                        ANT.user[ i ] = ( !isNaN( message.data[i] ) ) ? parseInt(message.data[i],10):message.data[i];
                                    }
                                }

                                if ( callbackFunction && args ) {
                                    //quick fix for page level data
                                    if(!args.kind && args.aWindow){
                                        args.kind = $(args.aWindow).data('kind');
                                    }
                                    args.user = ANT.user;
                                    callbackFunction(args);
                                    callbackFunction = null;
                                }
                                else if ( callbackFunction ) {
                                    callbackFunction();
                                    callbackFunction = null;
                                }

                                ANT.util.userLoginState();

                            } else if ( message.status == "xdm loaded" ) {
                                ANT.group.xdmLoaded = true;
                                ANT.events.fireEventQueue();
                            } else if ( message.status == "board_created" ) {
                                $('div.ant-board-create-div').remove();
                            } else if ( message.status == "board_create_cancel" ) {
                                clearInterval( ANT.checkingBoardWindow );
                                $('div.ant-board-create-div').remove();
                            } else if ( message.status == "getUserLoginState" ) {
                                ANT.session.getUser();

                                //I would think this needs to get added as a callback to the function above, but looks like we don't need it.
                                // ANT.util.userLoginState();

                                $('#ant_loginPanel').remove();
                            } else if ( message.status == "fb_user_needs_to_login" ) {
                                if ( callbackFunction && args ) {
                                    ANT.session.showLoginPanel( args, callbackFunction );
                                } else {
                                    ANT.session.showLoginPanel( args );
                                }
                            } else if ( message.status == "close login panel" ) {
                                ANT.util.userLoginState();
                                $('#ant_loginPanel').remove(); // little brute force, maybe should go elsewhere?
                                $('div.ant-summary div.ant_info').html('<em>You\'re logged in!  Try your last reaction again.');
                            } else if ( message.status == "already had user" ) {
                                // todo: when is this used?
                                $('#ant_loginPanel div.ant_body').html( '<div style="padding: 5px 0; margin:0 8px; border-top:1px solid #ccc;"><strong>Welcome!</strong> You\'re logged in.</div>' );
                            // } else if ( message.status == "educate user" ) {
                                // ANT.session.alertBar.make('educateUser');
                            } else if ( message.status.indexOf('recircClick') != -1 ) {
                                var linkData = message.status.split('|');
                                if ( linkData[1] ) {
                                    ANT.session.referring_int_id = parseInt( linkData[1], 10 ); // TODO what is this used for any more?
                                }
                                ANT.events.trackEventToCloud({
                                    event_type: 'rc',
                                    event_value: ''+ANT.session.referring_int_id,
                                    page_id: ANT.util.getPageProperty('id')
                                });
                            } else if ( message.status.indexOf('sharedLink') != -1 ) {
                                var sharedLink = message.status.split('|');
                                if ( sharedLink[5] ) {
                                    ANT.session.referring_int_id = parseInt( sharedLink[5], 10 ); // TODO what is this used for any more?
                                }
                                // TODO sharedLink[6] is SHARE HACK REMOVE THIS DAILYCANDY ONLY
                                ANT.session.getSharedLinkInfo( { container_hash:sharedLink[1], location:sharedLink[2], reaction:sharedLink[3], content:sharedLink[4], page_hash:sharedLink[6], redirect_type:sharedLink[7] } );
                            }
                        }
                    },
                    ANT_baseUrl
                );
            },
            login: function() {},
            checkForMaxInteractions: function(){
                ANT.user = ANT.user || {};
                var isTempUser = !ANT.user.user_type
                if ( isTempUser && ANT.user.num_interactions && ANT.user.num_interactions >= ANT.group.temp_interact ) {
                  return true;
                }
                return false;
            },
            showLoginPanel: function(args, callback) {
             // ANT.session.showLoginPanel

                $('.ant_rewritable').removeClass('ant_rewritable');

                if ( $('#ant_loginPanel').length < 1 ) {
                    // $('#ant_loginPanel').remove();
                    //todo: weird, why did commenting this line out not do anything?...look into it
                    //porter says: the action bar used to just animate larger and get populated as a window
                    //$('div.ant.ant_actionbar').removeClass('ant_actionbar').addClass('ant_window').addClass('ant_rewritable');

                    var coords;

                    if ( args && args.aWindow ) {
                        var caller = args.aWindow;
                        coords = caller.offset();
                        coords.left = coords.left ? (coords.left-34) : 100;
                        coords.top = coords.top ? (coords.top-25) : 100;
                    } else {
                        coords = [];
                        coords.left = ( $(window).width() / 2 ) - 200;
                        coords.top = 150 + $(window).scrollTop();
                    }

                    var $aWindow = ANT.aWindow.draw({
                        coords:coords,
                        id: "ant_loginPanel",
                        // pnlWidth:360,
                        pnls:1,
                        height:175,
                        ignoreWindowEdges:"bt",
                        purpose:'login'  // will prevent the other windows from being hidden
                    });

                    // store the arguments and callback function that were in progress when this Login panel was called
                    if ( args ) $aWindow.data( 'args', args );
                    if ( callback ) $aWindow.data( 'callback', callback );

                    // create the iframe containing the login panel
                    // var $loginHtml = $('<div class="ant_login" />'),
                    var iframeUrl = ANT_baseUrl + "/static/fb_login.html",
                        parentUrl = window.location.href,
                        parentHost = window.location.protocol + "//" + window.location.host,
                        h1_text = ( args && args.response && args.response.message.indexOf('Temporary user interaction') != -1 ) ? "Log In to Continue Reacting":"Log In to Antenna",
                        $loginIframe = $('<iframe id="ant-xdm-login" src="' + iframeUrl + '?parentUrl=' + parentUrl + '&parentHost=' + parentHost + '&group_id='+ANT.group.id+'&group_name='+ANT.group.name+'" width="280" height="200" frameborder="0" style="overflow:hidden; width:280px !important;height:200px;" />' );
                        
                    if ( args && args.response && args.response.message.indexOf('organic') != -1 ) {
                        h1_text = "Signing in is required for custom reactions";
                    }
                    var $header = ANT.aWindow.makeHeader( h1_text );
                    $aWindow.find('.ant_header').replaceWith($header);
                    ANT.aWindow.hideFooter($aWindow);
                    $aWindow.find('div.ant_body_wrap').append('<div class="ant_body" />').append( $loginIframe );

                    // ANT.events.track( 'show_login' );
                }
            },
            killUser: function() {
                ANT.user = {};
                ANT.util.killSessions();
                $.postMessage(
                    "killUser",
                    ANT_baseUrl + "/static/xdm.html",
                    window.frames['ant-xdm-hidden']
                );
            },
            aWindowUserMessage: {
                show:  function(args) {
                    //ANT.session.aWindowUserMessage.show:
                    var $aWindow = args.aWindow;
                    var interactionInfo = args.interactionInfo;

                    if ( $aWindow ) {

                        var msgType = args.msgType || null, //defaults to tempUser
                            userMsg = null,
                            actionPastTense;

                        var extraHeight = 45,  //$aWindowMsgDiv.height(),
                            bodyWrapHeight = 10,
                            aWindowHeight = $aWindow.height(),
                            durr = 300;

                        var $bodyWraps = $aWindow.find('.ant_body_wrap');
                        var $aWindowMsgDiv = $aWindow.find('div.ant_aWindow_message'),
                            $aWindowMsgDivInnerwrap = $aWindow.find('.ant_aWindow_message_innerwrap'),
                            $otherTagsWrap = $('div.ant_otherTagsWrap'),
                            $tmpUserMsg = $aWindow.find('.ant_aWindow_message_tempUserMsg');

                        $aWindowMsgDiv.show();

                        switch (msgType) {

                            case "tempUser":
                                //for now, just ignore this
                                var num_interactions_left = ANT.group.temp_interact - parseInt( args.num_interactions, 10 ),
                                    $loginLink = $('<a href="javascript:void(0);">Connect with Facebook</a>.');

                                $loginLink.click( function() {
                                    ANT.session.showLoginPanel( args );
                                });

                                // no t()
                                var tmpUserMsg = 'You can react or comment <strong>' + num_interactions_left + ' more times</strong> before you must ';

                                $tmpUserMsg.empty().append('<span>'+tmpUserMsg+'</span>');
                                $tmpUserMsg.append($loginLink);

                                break;

                            // case "existingInteraction":
                            //     userMsg = "You have already given that reaction for this.";
                            //     break;
                                

                            case "interactionSuccess":

                                if(interactionInfo.remove){
                                    userMsg = "The "+interactionInfo.type+" <em>"+interactionInfo.body+"</em><br />has been removed." ;
                                    $tmpUserMsg.empty();
                                }else{

                                    // no t()
                                    userMsg = (interactionInfo.type == 'tag') ?
                                        "You have tagged this <em>"+interactionInfo.body+"</em>." :
                                    (interactionInfo.type == 'comment') ?
                                        "You have left your comment." :
                                        ""; //this default shouldn't happen
                                    userMsg += " See your "+interactionInfo.type+"s on this page, and at <strong><a href='"+ANT_baseUrl+"' target='_blank'>antenna.is</a></strong>";
                                }

                                var click_args = args;
                                if ( $aWindow.find('div.ant_aWindow_message_tempUserMsg').text().length > 0 ) {
                                    $inlineTempMsg = $('<div />');
                                    // no t()
                                    $inlineTempMsg.html( '<h4 style="font-size:17px;">You can react '+ $aWindow.find('div.ant_aWindow_message_tempUserMsg strong').text() +'.</h4><br/><p><a style="font-weight:bold;color:#008be4;" href="javascript:void(0);">Connect with Facebook</a> to react as much as you want &amp; show other readers here what you think.</p><br/><p>Plus, you can share and comment in-line!</p><br/><a href="javascript:void(0);"><img src="'+ANT_staticUrl+'widget/images/fb-login_to_antenna.png" alt="Connect with Facebook" /></a>');
                                    $inlineTempMsg.find('a').click( function() {
                                        ANT.session.showLoginPanel( click_args );
                                    });

                                }

                                break;

                        }

                        if(userMsg){
                            $aWindowMsgDiv.find('span.ant_userMsg').html( userMsg );
                        }

                        $aWindowMsgDivInnerwrap.hide();
                        $aWindow.queue('userMessage', function(){
                            if( $aWindowMsgDiv.height() > 0 ){
                                //already expanded
                                $aWindowMsgDivInnerwrap.fadeIn(500);
                                $(this).dequeue('userMessage');
                            }else{
                                //expand it and expand the window with it.
                                //I know this simo animations together are a bit much - this should be redesigned
                                $aWindow.animate({ height: aWindowHeight+extraHeight }, durr);
                                $otherTagsWrap.animate({ bottom:0 }, durr);
                                $bodyWraps.animate({
                                    bottom: extraHeight
                                }, durr);
                                $aWindowMsgDiv.animate({ height:extraHeight },durr, function(){
                                    $aWindowMsgDivInnerwrap.fadeIn(500);
                                    $(this).dequeue('userMessage');
                                });
                            }
                        });
                        $aWindow.dequeue('userMessage');
                    }
                },
                hide: function($aWindow) {
                    //ANT.session.aWindowUserMessage.hide:
                    if ( $aWindow ) {

                        var $aWindowMsgDiv = $('div.ant_aWindow_message');
                            $otherTagsWrap = $('div.ant_otherTagsWrap');

                        var $bodyWraps = $aWindow.find('.ant_body_wrap');
                            //else

                            //todo: make this a better solution.  The simultaneous animations might not be ideal.
                            var extraHeight = $aWindowMsgDiv.height(),  //$aWindowMsgDiv.height(),
                                aWindowHeight = $aWindow.height(),
                                durr = 300,
                                bodyWrapHeight = 10;

                            //no need to use queue like this here, but this is how we can use it when we need to
                            //expand the aWindow first and then slide down the msgBar
                            $aWindow.queue('userMessage', function(){
                                $aWindow.animate({ height: aWindowHeight-extraHeight }, durr);
                                $otherTagsWrap.animate({ bottom: 0-bodyWrapHeight }, durr);
                                $bodyWraps.animate({
                                    bottom: bodyWrapHeight
                                }, durr);
                                $aWindowMsgDiv.animate({ height:0 }, durr, function(){
                                    $aWindowMsgDiv.hide();
                                    $(this).dequeue('userMessage');
                                });
                            });
                            $aWindow.dequeue('userMessage');
                    }
                }
            }
        },
        actions: {
            //ANT.actions:
            aboutAntenna: function() {
            },
            init: function(){
                //ANT.actions.init:
                var that = this;
                $ANT = $(ANT);
                window.antenna_extend_per_container = window.antenna_extend_per_container || {};
                $ANT.queue('initAjax', function(next){
                    ANT.util.checkSessions();
                    that.initGroupData(ANT.group.short_name);
                    //next fired on ajax success
                });
                $ANT.queue('initAjax', function(next){
                   //run this before initPageData.  There was a race condition
                   that.initEnvironment();
                   //next fired on ajax success
                });
                $ANT.queue('initAjax', function(next){
                   that.handleDeprecated();
                   //next fired on ajax success
                });
                $ANT.queue('initAjax', function(next){
                   that.initSeparateCtas();
                   $ANT.dequeue('initAjax');
                   //next fired on ajax success
                });
                $ANT.queue('initAjax', function(next){
                   that.initHTMLAttributes();
                   //next fired on ajax success
                });
                $ANT.queue('initAjax', function(next){
                    that.initPageData();
                    //next fired on ajax success
                });
                $ANT.queue('initAjax', function(next){
                    ANT.actions.runPostPageInit();

                    // this will check for FB login status, too, and set user data
                    ANT.session.createXDMframe();
                    //next fired on ajax success
                });
                $ANT.queue('initAjax', function(next){
                   ANT.util.checkForSelectedTextAndLaunchAWindow();
                   ANT.util.initPublicEvents();
                });
                $ANT.queue('initAjax', function(next){
                   ANT.util.initTouchBrowserSettings();
                });

                //start the dequeue chaindel
                $ANT.dequeue('initAjax');

            },
            initGroupData: function(groupShortName){
                // request the ANT Group Data

                var host = window.antenna_host;

                $.ajax({
                    url: ANT_baseUrl+"/api/settings/",
                    type: "get",
                    contentType: "application/json",
                    dataType: "jsonp",
                    data: {
                        // json: $.toJSON( {host_name : window.location.host} ) // has port
                        json: $.toJSON( {host_name : host } )  // no port
                    },
                    success: function(response, textStatus, XHR) {
                        var group_settings = response.data;


                        // handle deprecated .blessed_tags, change to .default_reactions
                        if ( typeof group_settings != 'undefined' ) {
                            
                            // handle deprecated "no_readr", now called no_ant
                            if ( typeof group_settings.no_readr != 'undefined' ) {
                                group_settings.no_ant = group_settings.no_readr;
                                delete group_settings.no_readr;
                            }

                            if ( typeof group_settings.blessed_tags != 'undefined' ) {
                                // use .slice() to copy by value
                                // http://stackoverflow.com/questions/7486085/copying-array-by-value-in-javascript
                                group_settings.default_reactions = group_settings.blessed_tags.slice();
                                delete group_settings.blessed_tags;
                            }

                            if (typeof group_settings.img_indicator_show_side !='undefined' && !group_settings.img_indicator_show_side ) { delete group_settings.img_indicator_show_side; }
                            if (typeof group_settings.tag_box_bg_colors !='undefined' && !group_settings.tag_box_bg_colors ) { delete group_settings.tag_box_bg_colors; }
                            if (typeof group_settings.tag_box_text_colors !='undefined' && !group_settings.tag_box_text_colors ) { delete group_settings.tag_box_text_colors; }
                            if (typeof group_settings.tag_box_bg_colors_hover !='undefined' && !group_settings.tag_box_bg_colors_hover ) { delete group_settings.tag_box_bg_colors_hover; }
                            if (typeof group_settings.tag_box_font_family !='undefined' && !group_settings.tag_box_font_family ) { delete group_settings.tag_box_font_family; }
                            if (typeof group_settings.tags_bg_css !='undefined' && !group_settings.tags_bg_css ) { delete group_settings.tags_bg_css; }
                        }
                        var custom_group_settings = (ANT.groupSettings) ? ANT.groupSettings.getCustomSettings():{};

                        ANT.group = $.extend({}, ANT.group.defaults, group_settings, custom_group_settings );
                        // ANT.group.tag_box_bg_colors = ANT.group.tag_box_bg_colors.split(';');
                        // ANT.group.tag_box_text_colors = ANT.group.tag_box_text_colors.split(';');

                        var a_or_b_or_not = '';
                        if ( ANT.group.ab_test_impact === true ) {
                            a_or_b_or_not = ( ANT.util.activeAB() ) ? 'A':'B';
                        }

                        ANT.events.trackEventToCloud({
                            event_type: 'sl',
                            event_value: a_or_b_or_not,
                            page_id: ANT.util.getPageProperty('id'),
                            content_attributes: ( ANT.util.activeAB() && $(ANT.group.recirc_selector).first().length ) ? 'broadcast':
                                    (!!ANT.group.content_attributes) ? ANT.group.content_attributes : null
                        });

                        if (ANT.group.hideOnMobile === true && isTouchBrowser) {
                            return false;
                        }

                        ANT.group.anno_whitelist += ',div.ant_br_replaced';

                        ////// do this in initPageData instead, so that ajax-loaded pages also get the settings applied
                        // $(ANT.group.no_ant).each( function() {
                        //     var $this = $(this);
                        //     $this.addClass('no-ant');
                        //     $this.find('img').addClass('no-ant');
                        // });

                        // setup the active sections + anno_whitelist (i.e. allowed tags)
                        if ( ANT.group.active_sections == "" ) {
                            ANT.group.active_sections = "body";
                        }

                        var active_sections = ANT.group.active_sections.split(','),
                            active_sections_with_anno_whitelist = "",
                            anno_whitelist = ANT.group.anno_whitelist.split(',');
                        
                        $.each(active_sections, function(active_idx, active_selector) {
                            active_selector = $.trim( active_selector );
                            
                            $.each( anno_whitelist, function(anno_idx, anno_selector) {
                                anno_selector = $.trim(anno_selector);
                                active_sections_with_anno_whitelist += active_selector + ' ' + anno_selector;

                                // add a comma if this isn't the last item in the loop
                                if ( anno_idx != anno_whitelist.length -1 ) {
                                    active_sections_with_anno_whitelist += ',';
                                }
                            });
                            // add a comma if this isn't the last item in the loop
                            if ( active_idx != active_sections.length -1 ) {
                                active_sections_with_anno_whitelist += ',';
                            }
                        });

                        ANT.group.active_sections_with_anno_whitelist = active_sections_with_anno_whitelist;
                        

                        // it's not a CSS URL, but rather custom CSS rules.  We should change the name in the model...
                        // this embeds custom CSS.

                        $('head').append( $('<style type="text/css">'+
                            'div.ant div.ant_body.ant_tags_list { '+ ANT.group.tags_bg_css +' }' +
                            'div.ant div.ant_body.ant_tags_list .ant_box { '+ ANT.group.tag_box_bg_colors + ' }' +
                            'div.ant div.ant_body.ant_tags_list .ant_box:hover { '+ ANT.group.tag_box_bg_colors_hover +' }' +
                            'div.ant div.ant_body.ant_tags_list .ant_box .ant_tag_actions * { '+ ANT.group.tag_box_text_colors +' }' +
                            'div.ant div.ant_body.ant_tags_list .ant_box .ant_tag_body * { '+ ANT.group.tag_box_text_colors +' }' +
                            // 'div.ant div.ant_body.ant_tags_list .ant_box .ant_tag_body,' +
                            // 'div.ant div.ant_body.ant_tags_list .ant_box .ant_tag_body span.ant_count,' +
                            // 'div.ant div.ant_body.ant_tags_list .ant_box .ant_tag_body span.ant-search,' +
                            // 'div.ant div.ant_body.ant_tags_list .ant_box .ant_tag_body .ant-comment,' +
                            // 'div.ant div.ant_body.ant_tags_list .ant_box .ant_tag_body span.ant_plusOne { '+ ANT.group.tag_box_text_colors +' }' +
                            // 'div.ant div.ant_body.ant_tags_list .ant_box .ant_tag_body .ant_comment_hover { '+ ANT.group.tag_box_text_colors +' }' +
                            '</style>') );


                        if ( ANT.group.custom_css !== "" ) {
                            $('head').append( $('<style type="text/css">' + ANT.group.custom_css + '</style>') );
                        }

                        // if (ANT.group.antenna_host) {
                        //     window.antenna_host = ANT.group.antenna_host;
                        // }

                        $ANT.dequeue('initAjax');

                    },
                    error: function(response) {
                        //for now, ignore error and carry on with mockup
                    }
                });
            },
            initPageData: function(){
                var queryStr = ANT.util.getQueryStrFromUrl(ANT.engageScriptSrc);
                ANT.engageScriptParams = ANT.util.getQueryParams(queryStr);


                $(ANT.group.no_ant).each( function() {
                    var $this = $(this);
                    $this.addClass('no-ant');
                    $this.find('img').addClass('no-ant');
                });
          
                // if (typeof ANT.group.useDefaultSummaryBar == 'undefined') {
                //     ANT.group.useDefaultSummaryBar = (
                //         ANT.engageScriptParams.bookmarklet &&
                //         !$('.ant-page-summary').length &&
                //         // !$(ANT.group.post_selector).length &&
                //         !$(ANT.group.summary_widget_selector).length &&
                //         ANT.group.summary_widget_selector != 'none'
                //     ) ? true:false;

                //     if (ANT.group.useDefaultSummaryBar===true){
                //         //add a class defaultSummaryBar to show that this is our added ant-page-summary
                //         //and not a publisher added one.
                //         $('<div id="ant-page-summary" class="ant no-ant ant-page-summary defaultSummaryBar" style="top:-999px !important"/>').appendTo('body');
                //     }
                // }
                
                // ANT.session.educateUser(); //this function has changed now
               //? do we want to model this here to be symetrical with user and group data?

                // TODO flesh out Porter's code below and incorporate it into the queue

                // make one call for the page unless post_selector, post_href_selector, summary_widget_selector are all set to not-an-empty-string AND are present on page

                // defaults for just one page / main page
                var pagesArr = [],
                    urlsArr = [],
                    thisPage,
                    key,
                    url,
                    canonical_url,
                    page_image,
                    title;

                // temp used as a helper to get the pageurl.
                var pageDict = {};

                var num_posts = 0;

                // if multiple posts, add additional "pages"
                if (   
                        ANT.group.post_selector !== "" &&
                        ANT.group.post_href_selector !== "" && 
                        ANT.group.summary_widget_selector !== ""
                    ) {

                        var $posts = $(ANT.group.post_selector),
                            num_posts = $posts.length;

                        //if $(ANT.group.post_selector).length is 0, this will just do nothing
                        $posts.each( function(){
                            // var key = pagesArr.length;
                            var $post = $(this);
                            var $post_href = $post.find(ANT.group.post_href_selector);
                            
                            if (typeof $post_href == 'undefined' || $post_href.length === 0 || typeof $post_href.attr('href') == 'undefined') {
                                url = (ANT.util.getPageProperty('canonical_url') == 'same') ? ANT.util.getPageProperty('page_url') : ANT.util.getPageProperty('canonical_url');
                            } else {
                                url = ANT.actions.removeSubdomainFromPageUrl( $post_href.attr('href') );
                            }

                            var $summary_widget = $post.find(ANT.group.summary_widget_selector).eq(0);

                            function nearWindow($thisPost) {
                                var offsets = $thisPost.offset();
                                var w = window,
                                    d = document,
                                    e = d.documentElement,
                                    g = d.getElementsByTagName('body')[0],
                                    x = w.innerWidth || e.clientWidth || g.clientWidth,
                                    y = w.innerHeight|| e.clientHeight|| g.clientHeight,
                                    top = $(document).scrollTop(),
                                    almostInView = y+top+300;

                                if ( offsets.top < almostInView ) {
                                    return true;
                                } else {
                                    return false;
                                }

                            }

                            // if ( $post_href.attr('href') && nearWindow($post) && !$post.hasAttr('ant-page-checked') ) {
                            if ( nearWindow($post) && !$post.hasAttr('ant-page-checked') ) {
                                $post.attr('ant-page-checked', true);

                                // url = $post_href.attr('href');

                                // IE fix for window.location.origin
                                if (!window.location.origin) {
                                    window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: '');
                                }

                                // does this URL have the origin on it?  or does it just begin with a relative path?
                                if ( url.indexOf(window.location.origin) == -1 ) {
                                    // dont do this if we're supposed to ignore the subdomains
                                    // "ignore" really means "override"
                                    if (ANT.group.ignore_subdomain != true) {
                                        if ( url.substr(0,1) == "/" ) {
                                            url = window.location.origin + url;
                                        } else {
                                            url = window.location.origin + window.location.pathname + url;
                                        }
                                    }
                                }

                                var urlHash = ANT.util.md5.hex_md5(url);
                                if ( !$post.hasAttr('ant-page-container') ) {
                                    $post.attr( 'ant-page-container', 'true' ).attr('ant-page-key',urlHash);
                                }
                                $summary_widget.attr('ant-page-widget-key',urlHash);

                                urlsArr.push(url);
                                if (num_posts == 1) {
                                    page_image = (ANT.group.image_selector && ANT.group.image_attribute) ? $("html").find(ANT.group.image_selector).first().attr( ANT.group.image_attribute ) : '';
                                }
                                
                                thisPage = {
                                    group_id: parseInt(ANT.group.id, 10),
                                    url: url,
                                    canonical_url: 'same',
                                    title: $post_href.text(),
                                    image: page_image
                                };

                                pagesArr.push(thisPage);
                                pageDict[key] = thisPage;

                                // if ( !$post.hasAttr('ant-page-container') ) {
                                //     $post.attr( 'ant-page-container', 'true' ).attr('ant-page-key',key);
                                // }
                                // $summary_widget.attr('ant-page-widget-key',key);
                            }
                        });
                }

                // defaults for just one page / main page.  we want this last, so that the larger page call happens last, and nodes are associated with posts first.
                // var pageUrl = ANT.util.getPageProperty('page_url');

                var pageUrl = ANT.util.getPageProperty('page_url');

                if ( num_posts === 0 && ($.inArray(pageUrl, urlsArr) == -1 || urlsArr.length == 0) ) {
                    var $body = $('body');

                    if ( !$body.hasAttr('ant-page-checked') ) {
                        canonical_url = ANT.util.getPageProperty('canonical_url');
                        title = ANT.util.getPageProperty('title');
                        
                        page_image = (ANT.group.image_selector && ANT.group.image_attribute) ? $("html").find(ANT.group.image_selector).first().attr( ANT.group.image_attribute ) : '';

                        // is this OK?  it is for when the <link rel="canonical" ...> tag has an href like href="//somesite.com/index.html"
                        // if (canonical_url.indexOf('//') === 0) {
                            // canonical_url = canonical_url.substr(2);
                            // canonical_url = window.location.protocol + canonical_url;
                        // }

                        thisPage = {
                            group_id: parseInt(ANT.group.id, 10),
                            url: pageUrl,
                            canonical_url: (pageUrl == canonical_url) ? "same" : canonical_url,
                            title: title,
                            image:page_image
                        };

                        ANT.group.thisPage = thisPage;

                        pagesArr.push(thisPage);
                        key = pagesArr.length-1;
                        // key = ANT.util.md5.hex_md5(pageUrl);
                        pageDict[key] = thisPage;

                        if ( !$body.hasAttr('ant-page-container') ) {
                            // $body.attr( 'ant-page-container', 'true' ).attr('ant-page-key',key).attr('ant-page-checked', true);
                            $body.attr('ant-page-key',key).attr('ant-page-checked', true);;

                            if ( $('.ant-page-summary').length == 1 ) {
                                $('.ant-page-summary').attr('ant-page-widget-key',key);
                            } else {
                                var $widget_key_last = $body.find(ANT.group.summary_widget_selector).eq(0);
                                // this seems unnecessary, but, on a blogroll, we don't want to have two widget keys on the first post's summary box
                                if ( $widget_key_last.attr('ant-page-widget-key') != "0" ) {
                                    $widget_key_last.attr('ant-page-widget-key', key);
                                }
                            }
                        }
                    }
                }
                var sendData = {
                    pages: pagesArr
                };

                if (pagesArr.length) {
                    //TODO: if get request is too long, handle the error (it'd be b/c the URL of the current page is too long)
                    //might not want to send canonical, or, send it separately if/only if it's different than URL
                    $.ajax({
                        url: ANT_baseUrl+"/api/page/",
                        type: "get",
                        contentType: "application/json",
                        dataType: "jsonp",
                        data: { json: $.toJSON(sendData) },
                        success: function(response) {
                            if ( response.status !== "success" ) {
                                return false;
                            } else {
                                ANT.status.page = true;
                            }

                            // ANT.events.track( 'load' );
                            
                            // var load_event_value = '',
                            //     pages_count = $(ANT.group.post_selector).length;
                            // if (ANT.group.useDefaultSummaryBar){
                            //     load_event_value = 'def';
                            // } else {
                            //     if (pages_count === 1) {
                            //         load_event_value = 'si'; // single page load
                            //     } else if (pages_count > 1) {
                            //         load_event_value = 'mu' // multiple pages loaded
                            //     } else {
                            //         load_event_value = 'unex';
                            //     }
                            // }

                            var load_event_value = '';
                            if (ANT.group.useDefaultSummaryBar === true){
                                load_event_value = 'def';
                            } else {
                                if (response.data.length === 1) {
                                    load_event_value = 'si'; // single page load
                                } else if (response.data.length > 1) {
                                    load_event_value = 'mu' // multiple pages loaded
                                } else {
                                    load_event_value = 'unex';
                                }
                            }

                            $.each( response.data, function(idx,page){
                                //todo: it seems like we should use the page.id as the unique identifier instead of introducting 'key' which is just a counter
                                page.url = pageDict[key].url;
                                page.key = ANT.util.md5.hex_md5(page.url);
                                ANT.actions.pages.save(page.id, page);
                                ANT.actions.pages.initPageContainer(page.id);
                            });
                            var a_or_b_or_not = '';
                            if ( ANT.group.ab_test_impact === true ) {
                                a_or_b_or_not = ( ANT.util.activeAB() ) ? 'A':'B';
                            }

                            ANT.events.trackEventToCloud({
                                event_type: 'wl',
                                event_value: a_or_b_or_not,
                                page_id: ANT.util.getPageProperty('id'),
                                content_attributes: (!!ANT.group.content_attributes) ? ANT.group.content_attributes : load_event_value
                            });

                            $ANT.dequeue('initAjax');
                        },
                        error: function(response) {
                            //for now, ignore error and carry on with mockup
                        }
                    });
                // } else {
                    // $ANT.dequeue('initAjax');
                }

            },
            runPostPageInit: function(){
                //ANT.actions.runPostPageInit:
                ANT.actions.indicators.utils.updateContainerTrackers();

                // todo: this is a pretty wide hackey net - rethink later.
                // var imgBlackListFilter = (ANT.group.img_blacklist&&ANT.group.img_blacklist!="") ? ':not('+ANT.group.img_blacklist+')':'';

                // init media object on load.
                // this is new, but we want the experience for images to be faster.
                $(ANT.group.active_sections).find('embed[ant-node], video[ant-node], iframe[ant-node], img[ant-node],'+ANT.group.anno_whitelist).each( function() {
                // $(ANT.group.active_sections).find('embed[ant-node], video[ant-node], object[ant-node], iframe[ant-node], img[ant-node],'+ANT.group.anno_whitelist).each( function() {
                    // hash not present and that's the problem.
                    // why does listing article FIRST cause this break?
                    var hash = $(this).attr('ant-hash');
                    ANT.actions.indicators.init( hash );
                    ANT.actions.content_nodes.init(hash, function(){});
                });

                if(isTouchBrowser){

                    // init the "indicators" for text objects, on mobile only.
                    // so that the image call-to-action is present and populated
                    // $(ANT.group.active_sections).find('embed[ant-node], video[ant-node], object[ant-node], iframe[ant-node], img[ant-node]').each( function() {

                    // ensure each text node is hashed and has indicator so that we can engage it
                    $( ANT.group.active_sections_with_anno_whitelist ).each(function(idx, node) {
                        ANT.actions.indicators.init( $(node).attr('ant-hash') );
                    });


                    if ( !localStorage.getItem('hideDoubleTapMessage') && !ANT.group.hideDoubleTapMessage ) {
                        var double_tap_message = (ANT.group.doubleTapMessage) ? ANT.group.doubleTapMessage : ANT.t('doubleTapMessage') +' <a>'+ANT.t('close')+'</a>',
                            double_tap_message_position = (ANT.group.doubleTapMessagePosition) ? 'ant_'+ANT.group.doubleTapMessagePosition : 'ant_bottom',
                            $doubleTapMessage = $('<div class="ant ant_mobile_message">'+double_tap_message+'</div>'),
                            $sandbox = $('#ant_sandbox');

                        $doubleTapMessage.addClass( double_tap_message_position ).on('touchend.ant', function(e) {
                            e.preventDefault();
                            // we should handle settings through localStorage.  will do later.
                            localStorage.setItem('hideDoubleTapMessage', true);
                            $(this).remove();
                        }).appendTo( $sandbox );
                    }

                }else if ( ANT.util.activeAB() )  {

                    $(ANT.group.active_sections) // imagemouseover imghover imagehover imgmouseenter
                        .on( 'mouseenter.ant', 'embed, video, iframe, img', function(){
                        // .on( 'mouseenter.ant', 'embed, video, object, iframe, img', function(){
                            ANT.actions.containers.media.disengageAll();

                            var $this = $(this);
                            // setTimeout(function(){
                                // $this.addClass('ant_live_hover');
                            // },300);
                            $this.addClass('ant_live_hover');
                            
                            ANT.actions.mediaNodeInit($this);
                        })
                        .on( 'mouseleave.ant', 'embed, video, iframe, img', function(event){
                        // .on( 'mouseleave.ant', 'embed, video, object, iframe, img', function(event){
                            var $this = $(this),
                                hash = $this.data('hash');

                            // only fire the event if NOT in a known image container... otherwise we want the event to fire once, from the container
                            if ( !$this.parents( ANT.group.img_container_selectors ).length ) {
                                _mediaHoverOff( $this )
                            }
                            // $('#ant_indicator_' + hash).removeClass('ant_visible');
                            ANT.util.setFunctionTimer( function() {
                            // setTimeout(function(){
                                $('#ant_indicator_' + hash).removeClass('ant_visible');
                            },300, hash);
                    });
                }

                if (!ANT.util.activeAB()) return;
                ANT.events.emit('antenna.hashed_nodes', 'complete', { });
                
                function _mediaHoverOff( obj ) {
                    var $this = $(obj),
                        hash = $this.data('hash');

                    // $this.removeClass('ant_live_hover');
                    setTimeout(function(){
                        $this.removeClass('ant_live_hover');
                    },300);
                    $('#ant_indicator_' + hash).hide();
                }

            },
            mediaNodeInit: function($this) {

                //ANT.actions.mediaNodeInit:
                var hash = $this.data('hash');

                    ANT.actions.indicators.utils.updateContainerTrackers();

                if ( $this.closest('.no-ant').length ) {
                    return;
                }
                var minImgWidth = 100;

                if ( $this.width() >= minImgWidth ) {
                    var hasBeenHashed = $this.hasAttr('ant-hashed'),
                        isBlacklisted = $this.closest('.ant, .no-ant').length;

                    if(!hasBeenHashed && !isBlacklisted){

                        var hashListsByPageId = ANT.actions.hashNodes( $this );

                        //we expect just the one here, so just get that one.
                        var hash;
                        $.each( hashListsByPageId, function(page_id, hashArray) {
                            hash = hashArray[0];
                        });
                        if(!hash){
                            //i think there should always be a hash though
                            ANT.safeThrow('There should always be a hash from hashNodes after hover on an unhashed image.');
                            return;
                        }

                        ANT.actions.sendHashes( hashListsByPageId, function(){
                            // if( $this.hasClass('ant_live_hover') ){
                                if ( !$('#ant_indicator_details_'+hash).hasClass('ant_engaged') ) {
                                    // $('#ant_indicator_' + hash).show();
                                    // $('#ant_indicator_' + hash).addClass('ant_visible');
                                    ANT.util.setFunctionTimer( function() {
                                    // setTimeout(function(){
                                        $('#ant_indicator_' + hash).addClass('ant_visible');
                                    },200, hash);
                                }
                            // }
                            ANT.actions.content_nodes.init(hash, function(){});
                        });

                        //these calls are redundant to the same calls in the callback above,
                        //but this will make them show up right away,
                        //and then the ones in the callback will make sure they don't get lost when the indicator re-inits.
                        // ANT.actions.indicators.utils.borderHilites.update(hash);
                        // ANT.actions.indicators.utils.borderHilites.engage(hash);

                    } else {
                        var hash = $this.data('hash');
                        if ( !$('#ant_indicator_details_'+hash).hasClass('ant_engaged') ) {
                            ANT.util.setFunctionTimer( function() {
                            // setTimeout(function(){
                                $('#ant_indicator_' + hash).addClass('ant_visible');
                            }, 200, hash);

                            // $('#ant_indicator_' + hash).show();
                            // ANT.actions.indicators.utils.borderHilites.engage(hash);
                        }

                        ANT.actions.content_nodes.init(hash, function(){});
                    }

                }
            },
            initEnvironment: function(){
                ANT.current.page_url = ANT.util.getPageProperty('page_url');
                // if B group, ensure separate CTAs are not visible, but try not to reflow
                // if ( !ANT.util.activeAB() ) {
                //     $('.ant-custom-cta').css('visibility','hidden');
                // }

                ANT.broadcast.init();
                //This should be the only thing appended to the host page's body.  Append everything else to this to keep things clean.
                var $antSandbox = $('<div id="ant_sandbox" class="ant ant_sandbox"/>').appendTo('body');
                
                if(isTouchBrowser){
                    $('#ant_sandbox').addClass('isTouchBrowser');  // using this?
                    $('body').addClass('ant_touch_browser'); // definitely using this.
                }

                // get author, topics, tags from publisher-defined tags
                var page_attributes = ['topics', 'author', 'section'];
                $.each(page_attributes, function(idx, trait){
                    if ( ANT.group[trait+'_selector'] != 'undefined' && ANT.group[trait+'_attribute'] != 'undefined' && $( ANT.group[trait+'_selector'] ).length ){
                        ANT.group[trait] = '';
                        $(ANT.group[trait+'_selector']).each( function() {
                            ANT.group[trait] += $(this).attr(ANT.group[trait+'_attribute']) + ',';
                        });
                        ANT.group[trait] = ANT.group[trait].substr(0, ANT.group[trait].length-1);
                    }
                });

                // setup a scroll event detector
                /**/

                var active_section_offsets = $(ANT.group.active_sections+':eq(0)').offset();
                ANT.group.active_section_top = active_section_offsets.top;
                ANT.group.active_section_bottom = active_section_offsets.bottom;
                ANT.group.active_section_height = active_section_offsets.bottom - active_section_offsets.top;
                ANT.group.active_section_milestones = {
                    '0':ANT.group.active_section_top,
                    '20':((ANT.group.active_section_height/5)+ANT.group.active_section_top),
                    '40':((ANT.group.active_section_height/5*2)+ANT.group.active_section_top),
                    '60':((ANT.group.active_section_height/5*3)+ANT.group.active_section_top),
                    '80':((ANT.group.active_section_height/5*4)+ANT.group.active_section_top),
                    '100':ANT.group.active_section_bottom,
                    'fired':0
                    // 'fired_0':true,  // this should never fire
                    // 'fired_20':false,
                    // 'fired_40':false,
                    // 'fired_60':false,
                    // 'fired_80':false,
                    // 'fired_100':false
                };

        
                // $(window).on('scroll.ant', function() {
                    // i'm sure there is a good reason for this, but i don't recall what it is
                    // blog rolls maybe.  
                    // YEP, blog rolls.  gotta init the paged ata and summary widgets for each posts.

                    // neither debounce nor throttle is working
                    // ANT.util._.debounce( ANT.actions.initPageData, 150 );
                    // ANT.util._.throttle( ANT.actions.initPageData, 150 );

                // });
                
                $(window).on('scrollstart', function() {
                    // i'm sure there is a good reason for this, but i don't recall what it is
                    // blog rolls maybe.  
                    // YEP, blog rolls.  gotta init the paged ata and summary widgets for each posts.
                    ANT.actions.initPageData();

                    ANT.actions.indicators.utils.updateContainerTrackers();

                    ANT.actions.containers.media.disengageAll();
                });

                $(window).on('scrollstop', function() {
                    // lets do it again to make sure we init the data that the person might view
                    // suspect scrollstop > scrollstart, but either seems ok.

                    // i'm sure there is a good reason for this, but i don't recall what it is
                    // blog rolls maybe.  
                    // YEP, blog rolls.  gotta init the paged ata and summary widgets for each posts.
                    ANT.actions.initPageData();
                });

                if (!ANT.group.summary_widget_selector) {
                    ANT.events.recordEvents = 1;  // force data recording if summary widget selector is empty
                } else {
                    var groupPageSelector = (ANT.group.summary_widget_selector) ? ', '+ANT.group.summary_widget_selector : '';
                    ANT.events.recordEvents = $(".ant-page-summary" + groupPageSelector).length;
                }


                
                // this does not seem to work!
                // $(window).on('beforeunload.ant',function(event) {
                    // ANT.events.trackEventToCloud({
                    //     event_type: 'page_exit',
                    //     event_value: '',
                    //     page_id: ANT.util.getPageProperty('id')
                    // });
                // });

                // Antenna Timer?  unsure
                // ANT.util.setWindowInterval();

                ANT.util.fixBodyBorderOffsetIssue();
                
                if(!!ANT.group.br_replace_scope_selector){
                  ANT.util.fixBrTags();
                }

                //todo - move this stuff to a function
                    // this crazy-looking thing is because, if a CSS attribute like "left" is set to 50%...
                    // Firefox calculates it (returns a pixel value) while Chrome does not (returns the "50%")...
                    // yielding very different results when you parseInt that CSS value.
                    var bodyChanges = {
                            paddingLeft : ( $('body').css('padding-left').indexOf('%') != -1 ) ? ($(window).width() * (parseInt($('body').css('padding-left'))/100) ): parseInt($('body').css('padding-left')),
                            marginLeft : ( $('body').css('margin-left').indexOf('%') != -1 ) ? ($(window).width() * (parseInt($('body').css('margin-left'))/100) ): parseInt($('body').css('margin-left')),
                            left : ( $('body').css('left').indexOf('%') != -1 ) ? ($(window).width() * (parseInt($('body').css('left'))/100) ): parseInt($('body').css('left')),
                            paddingLeft : ( $('body').css('padding-top').indexOf('%') != -1 ) ? ($(window).width() * (parseInt($('body').css('padding-top'))/100) ): parseInt($('body').css('padding-top')),
                            marginTop : ( $('body').css('margin-top').indexOf('%') != -1 ) ? ($(window).width() * (parseInt($('body').css('margin-top'))/100) ): parseInt($('body').css('margin-top')),
                            top : ( $('body').css('top').indexOf('%') != -1 ) ? ($(window).width() * (parseInt($('body').css('top'))/100) ): parseInt($('body').css('top'))
                        },
                        bodyLeft = -(bodyChanges.marginLeft + bodyChanges.left + bodyChanges.paddingLeft ),
                        bodyTop = -(bodyChanges.marginTop + bodyChanges.top + bodyChanges.paddingTop );

                    bodyLeft = isNaN(bodyLeft) ? 0 : bodyLeft;
                    bodyTop = isNaN(bodyTop) ? 0 : bodyTop;

                    //todo: do this better
                    //add these offsets to the existing offsets that could come from fixBodyBorderOffsetIssue
                    var currTop = parseInt( $antSandbox.css('top'), 10 );
                    var currLeft = parseInt( $antSandbox.css('left'), 10);

                    ANT.util.cssSuperImportant($antSandbox, {
                            left: (currLeft+bodyLeft) +'px',
                            top: (currTop+bodyTop)+'px'
                        }, true);

                    $antSandbox.append('<style>.ant_twtooltip { margin-left:'+bodyLeft+'px !important; margin-top:'+bodyTop+'px !important;} '+ ANT.group.active_sections_with_anno_whitelist +' {-webkit-user-select: text; -khtml-user-select: text; -moz-user-select: text; -ms-user-select: text; user-select: text;} </style>');



                //div to hold indicatorBodies for media (images and video)
                $('<div id="ant_container_tracker_wrap" /><div id="ant_indicator_details_wrapper" /><div id="ant_event_pixels" />').appendTo($antSandbox);
          
                //div to hold indicators, filled with insertContainerIcon(), and then shown.
                // $('<div id="ant_indicator_details_wrapper" />').appendTo($antSandbox);
                //div to hold event pixels
                // $('<div id="ant_event_pixels" />').appendTo($antSandbox);

                $(document).on('mouseup.ant', function(e){
                    //temp fix for bug where a click that clears a selection still picks up the selected text:
                    //Todo: This should work in the future as well, but I want to look into it further.
                    setTimeout(function(){
                        ANT.actions.startSelectFromMouseUp(e);
                    }, 1 );
                    //even 0 works, so I'm not worried about 1 being too low.
                    //besides, the fail scenerio here is very minor - just that the actionbar hangs out till you click again.
                });

                if ( !isTouchBrowser ) {
                    $(document).on('mouseup.ant',function(event) {

                        var $mouse_target = $(event.target);

                        if ( ( $mouse_target.closest('.ant_inline').length ) || (!$mouse_target.hasAttr('ant-cta-for') && !$mouse_target.parents().hasClass('ant') && !$('div.ant-board-create-div').length) ) {
                            // if ( $('#ant_loginPanel').length ) {
                            //     ANT.session.getUser(function() {
                            //         ANT.util.userLoginState();
                            //     });
                            // }
                            
                            ANT.actions.UIClearState();

                            // if ( !isTouchBrowser ) {
                            $('div.ant_indicator_details_for_media').each( function() {
                                ANT.actions.containers.media.onDisengage( $(this).data('container') );
                            });
                            // }
                        }

                    });
                } else {
                    // $('.ant, ' + ANT.group.active_sections).on('touchend.ant',function(e) {
                    // $('body').on( 'touchend.ant', '.ant, ' + ANT.group.active_sections, function(e){
                    // $('body').on( 'touchstart.ant', function(e){
                    // });
                    $('body').on( 'touchend.ant', function(e){
                        // if (ANT.util.bubblingEvents['dragging'] == true ) { return; }
                        if ( ANT.util.isTouchDragging(e) ) { return; }
                        if (ANT.util.bubblingEvents['touchend'] === false) {

                            var $mouse_target = $(e.target);

                            if ( ( $mouse_target.closest('.ant_inline').length ) || (!$mouse_target.hasAttr('ant-cta-for') && !$mouse_target.parents().hasClass('ant') && !$('div.ant-board-create-div').length) ) {
                                // if ( ($mouse_target.hasAttr('ant-node') && $('.ant_window').length>1) || ( !$mouse_target.hasAttr('ant-node') && $('.ant_window').length ) ) {

                                // the container.singletap will handle container state clearing.  (unless and img.)  sigh.
                                // dunno why, of course.
                                if ( !$mouse_target.closest('[ant-node]').length || $mouse_target.get(0).nodeName.toLowerCase() == 'img' ) {
                                    ANT.actions.UIClearState();
                                }
                            }
                        }

                        ANT.util.bubblingEvents['touchend'] = false;
                    });

                    // iphone drag fix
                    // $('body').on( 'touchstart.ant', '.ant, ' + ANT.group.active_sections, function(e){
                    $('body').on( 'touchstart.ant', function(e){
                    // $('.ant, ' + ANT.group.active_sections).on('touchstart.ant',function(event) {
                    // $(document).on('touchstart.ant',function(event) {
                        ANT.util.bubblingEvents['startY'] = e.originalEvent.touches[0].clientY;
                    });

                    // NOW NOT NEEDED.  USING math FROM TOUCHSTART plus if ( ANT.util.isTouchDragging(e) ) { return; }
                    // $(document).on('touchmove.ant',function(event) {
                    //     if (Math.abs(event.originalEvent.touches[0].clientY - ANT.util.bubblingEvents['startY']) > 10 ) {
                    //         ANT.util.bubblingEvents['dragging'] = true;
                    //     }
                    // });
                    // $(document).on('touchstart.ant',function(e) {
                    // $(document).on('touchend.ant',function(event) {
                    //     if (Math.abs(event.originalEvent.changedTouches[0].clientY - ANT.util.bubblingEvents['startY']) > 10 ) {
                    //         ANT.util.bubblingEvents['dragging'] = true;
                    //     }

                    //     // if (ANT.util.bubblingEvents['dragging'] == true) {
                    //     //     event.stopImmediatePropagation();
                    //     //     ANT.util.bubblingEvents['dragging'] = false;
                    //     // }
                    // });
                }

                //bind an escape keypress to clear it.
                $(document).on('keyup.ant', function(event) {
                    if (event.keyCode == '27') { //esc
                        ANT.actions.UIClearState();
                    }
                });
                
                $(window).resize(ANT.util.throttledUpdateContainerTrackers());

                // Filter the set of nodes to eliminate anything inside our own DOM elements (otherwise, we generate a ton of chatter)
                function filteredElements(nodeList) {
                    var filtered = [];
                    for (var i = 0; i < nodeList.length; i++) {
                        var node = nodeList[i];
                        if (node.nodeType !== 3) { // Don't process text nodes
                            var $element = $(node);
                            if ( $element.closest('.ant,.ant_indicator,.ant-custom-cta-container').length === 0 ) {
                                filtered.push($element);
                            }
                        }
                    }
                    return filtered;
                }

                // dom mutation observer
                var observer = new MutationObserver(function(mutationRecords) {

                    for (var i = 0; i < mutationRecords.length; i++) {
                        var addedElements = filteredElements(mutationRecords[i].addedNodes);
                        if (addedElements.length > 0) {

                            // init separate CTAs
                            ANT.actions.initSeparateCtas();
                            ANT.actions.hashCustomDisplayHashes();

                            // let's make sure the icons for images, etc are where they should be
                            ANT.actions.indicators.utils.updateContainerTrackers();
                            

                            // make sure curreent page != the window.locatino, and, that the current page is not simply the TLD.
                            var windowPort = (window.location.port) ? ':'+window.location.port : '',
                                windowLocation = (window.location.protocol + '//' + window.location.hostname + windowPort + window.location.pathname).toLowerCase();

                              if ( ANT.current && (ANT.current.page_url.split('//')[1].split('/').length == 2 || windowLocation.indexOf( ANT.current.page_url ) == -1) ) {
                                if (ANT.current.page_url != windowLocation) {
                                    // think we changed pages
                                    $('.ant-summary').remove();

                                    /*



                                    WE DO IT BASED ON PRESENCE OF THE FIRST [ant-hash].  once that disappears, or changes, and more content has appeared... then the content changed.




                                    */

                                     ANT.current.page_url = windowLocation;
                                        var attempts = 0;
                                        var tryToResetAntenna = setInterval( function() {

                                            // if ( ( $(ANT.group.summary_widget_selector).length && !$('.ant-summary').length) || attempts++ > 80 ) {
                                            // if ( ( $(ANT.group.summary_widget_selector).length && !$('.ant-summary').length) || attempts++ > 80 ) {

                                            if (attempts++ < 120) {
                                                var $active_sections = $(ANT.group.active_sections),
                                                    $firstContent = (ANT.current.first_hashed_content) ? $('[ant-hash="'+ANT.current.first_hashed_content+'"]') : $();

                                                if ( $firstContent.length ) {
                                                    // ANT.actions.removeHashes( $firstContent );
                                                    ANT.actions.hashNodes( $firstContent, true );
                                                }

                                                if ( $active_sections.length<1 || !ANT.current.first_hashed_content || !$firstContent.length ) {
                                                    if ( $active_sections.length && $active_sections.find(ANT.group.anno_whitelist).length  ) {
                                                        ANT.actions.reset();
                                                        ANT.actions.indicators.utils.updateContainerTrackers();
                                                        clearInterval(tryToResetAntenna);
                                                    }
                                                }
                                            } else {
                                                clearInterval(tryToResetAntenna);
                                            }
                                        }, 25);
                                    }
                                }
                        }
                    }


                });

                var body = document.body;
                observer.observe(body, {
                   childList: true,
                   attributes: false,
                   characterData: false,
                   subtree: true,
                   attributeOldValue: false,
                   characterDataOldValue: false
                });

                $ANT.dequeue('initAjax');
            },
            handleDeprecated: function() {
                //ant-content-type ????  could be come ant-content-attributes="question"
                // rewrite some deprecated Antenna attributes into their newer versions
                if (ANT.util.activeAB()) {
                    $('[ant-custom-display]').each( function() {
                        var $this = $(this);
                        $this.attr('ant-item', $this.attr('ant-custom-display') );
                        $this.removeAttr('ant-custom-display');
                    });
                }
                $ANT.dequeue('initAjax');
            },
            initSeparateCtas: function(){
                // ANT.actions.initSeparateCtas
                if (ANT.group.separate_cta) {
                    var separateCtaCount = 0;
                    var $separate_ctas = $(ANT.group.active_sections).find(ANT.group.separate_cta).not('[ant-hash]');

                    if ($separate_ctas.length) {
                        $separate_ctas.each( function(idx, node) {
                            var $node = $(node),
                                tagName = node.nodeName.toLowerCase(),
                                crossPage = '';

                            if ( $node.closest(ANT.group.no_ant).length ) {return;}
                            if ( $node.hasAttr('ant-item') ) {
                                var antItem = $node.attr('ant-item');
                            } else {
                                var antItem = 'ant-custom-cta-'+separateCtaCount;

                                if ( !$node.hasAttr('ant-item') ) {
                                    $node.attr('ant-item', antItem);
                                }
                            }
                            if ( !$('[ant-cta-for="'+antItem+'"]').length ) {
                                $node.after('<div class="ant-custom-cta-container" ant-tag-type="'+tagName+'"><div class="ant-custom-cta" ant-cta-for="'+antItem+'" ant-mode="read write"><span class="ant-antenna-logo"></span> <span ant-counter-for="'+antItem+'"></span> <span ant-reactions-label-for="'+antItem+'">'+ANT.t('your_reaction')+'</span></div> </div>');
                            }

                            separateCtaCount++;
                        });
                    }
                }
            },
            initHTMLAttributes: function() {
                // grab ant-items that have a set of ant-reactions and add to window.antenna_extend_per_container
                // if (ANT.util.activeAB()) {
                    $('[ant-item]').each( function () {
                    // $('[ant-reactions][ant-item]').each( function () {
                        var $this = $(this),
                            itemName = $this.attr('ant-item'),
                            reactions = ( $this.hasAttr('ant-reactions') ) ? $this.attr('ant-reactions') : '';

                        if ( reactions && typeof window.antenna_extend_per_container[itemName] == 'undefined' ) {
                            var itemDefinition = {};
                            itemDefinition.default_reactions = [];

                            $.each(reactions.split(';'), function(idx, tag) {
                                itemDefinition.default_reactions.push( $.trim(tag) );
                            });
                            window.antenna_extend_per_container[itemName] = itemDefinition;
                        }
                    });
                // }

                $ANT.dequeue('initAjax');
            },
            reInit: function() {
                // ANT.actions.reInit:
                ANT.actions.removeHashes();
                ANT.actions.hashCustomDisplayHashes();
            },
            reset: function() {
                // ANT.actions.reset:
                $('[ant-page-checked]').removeAttr('ant-page-checked');
                $('[ant-page-container]').removeAttr('ant-page-container');
                $('.ant-summary').remove();
                // ANT.actions.initPageData();
                $ANT.queue('initAjax', function(next){
                    ANT.actions.initPageData();
                    //next fired on ajax success
                });
                $ANT.queue('initAjax', function(next){
                    ANT.actions.runPostPageInit();
                });

                $ANT.dequeue('initAjax');
                ANT.actions.removeHashes();
                ANT.actions.hashCustomDisplayHashes();
            },
            UIClearState: function(e){
                // if (!isTouchBrowser) {
                    //ANT.actions.UIClearState:
                    // clear any errant tooltips
                    $('div.ant_twtooltip').remove();
                    $('.ant_live_hover').removeClass('ant_live_hover');

                    ANT.aWindow.closeAll();
                    ANT.actionbar.closeAll();
                    ANT.actions.containers.media.disengageAll();

                    // feels super janky
                    // doing this for slideshows, goal being to NOT have the publisher do a callback on slide-load-complete to ensure icons are cleared.
                    setTimeout(ANT.actions.containers.media.disengageAll, 333); // ensure it happens after a slow moving slideshow...
                    setTimeout(ANT.actions.containers.media.disengageAll, 1000); // ensure it happens after a slow moving slideshow...
                    // ANT.actions.indicators.utils.borderHilites.disengageAll();
                    // $('div.ant.ant_tag_details.ant_sbRollover').remove();
                    
                    if (!isTouchBrowser) { 
                        $('div.ant_indicator_for_media').hide();
                    }

                    $().selog('hilite', true, 'off');

                    //clear a share alert if it exists - do this better later.
                    var shareBoxExists = $('.ant_fromShareLink').length;
                    if( shareBoxExists ){
                        ANT.session.alertBar.close( 'fromShareLink' );
                    }
                // } else {

                // }
            },
            catchRangyErrors: function(errorMsg){
                //ANT.actions.catchRangyErrors:

                //safe throw the errror.
                ANT.safeThrow(errorMsg);
            },
            hashNodes: function( $passedInNode, forceRehash ) {
                //ANT.actions.hashNodes:
                var $nodes;

                // [porter]: needs a node or nodes
                if ( typeof $passedInNode==="undefined" || (!ANT.util.activeAB()) ) { return; }

                if ( $passedInNode.hasAttr('ant-item') ) {
                    $nodes = $passedInNode;
                } else if ($passedInNode.find(ANT.group.active_sections_with_anno_whitelist).length) {
                    $nodes = $passedInNode.find(ANT.group.active_sections_with_anno_whitelist);
                } else if ($passedInNode.find(ANT.group.anno_whitelist).length) {
                    $nodes = $passedInNode.find(ANT.group.anno_whitelist);
                } else {
                    $nodes = $passedInNode;
                }

                var $allNodes = $();

                $.each( $nodes, function(idx, node) {
                    var $node = $(node);

                    /*

                    TODO
                    do we need to check that the nodes are INSIDE a valid section, 
                    or is that handled by whatever passes the $nodes in???


                    */

                    if ( !$node.closest('.no-ant').length && !$node.hasClass('no-ant') && !$node.hasClass('ant') && (forceRehash || !$node.hasAttr('ant-hashed') ) ) {  // && 
                        var body = '',
                            kind = '',
                            HTMLkind = '';

                        HTMLkind = $node.get(0).nodeName.toLowerCase();

                        // determine the kind
                        if ( $node.hasAttr('ant-item-type') ) {
                            // if specified, use that: ant-item-type="media"
                            if ($node.attr('ant-item-type') == 'image') {
                                kind = 'img';  // since we set "image" in HTML attributes, but code uses "img"
                            } else {
                                kind = $node.attr('ant-item-type');
                            }
                        } else {
                            if (HTMLkind == 'img') {
                                kind = 'img';
                            }
                            if (HTMLkind == 'iframe' || HTMLkind == 'video' || HTMLkind == 'embed') {
                                kind = 'media';
                            }
                            if ($node.text()) {
                                kind = 'text';
                            }
                        }

                        // get ready to determine the content body
                        // TODO needed?????
                        // if ( $node.hasAttr('ant-item-content') ) {
                            // if has item content, use that before making adjustments
                            // body = $node.attr('ant-item-content');
                        // }

                        // determine the content body
                        if (kind=='media') {
                        // if media, and relative, prepend the body and such
                            var body = ($node.hasAttr('ant-item-content')) ? $node.attr('ant-item-content') :
                                       (typeof this.src != 'undefined') ? this.src : 
                                       (typeof this.data != 'undefined') ? this.data : '';

                            if (body.indexOf('/') === 0){
                                body = window.location.origin + body;
                            }
                            if (body.indexOf('http') !== 0){
                                body = window.location.origin + window.location.pathname + body;
                            }
                        }
                        if (kind=='img') {
                        // if image...
                            var body = ( $node.hasAttr('src') ) ? $node.attr('src') : $node.attr('ant-item-content');
                            if (!body) return;

                            if (body.indexOf('/') === 0){
                                body = window.location.origin + body;
                            }
                            if (body.indexOf('http') !== 0){
                                body = window.location.origin + window.location.pathname + body;
                            }
                        }

                        if (kind=='text') {
                        // if text
                            // just grab the text, but need to ensure this text != parent text, ensure validity.  maybe?
                            // var $node = $(node),
                                // node_text = $node.text();
                                // TODO need this?
                                // node_parent_text = $node.parent().text();

                                body = ANT.util.getCleanText($node);
                        }

                        // if custom
                            // body = $node.attr('ant-item-content') or $node.text()

                        // if text, compare against anno_whitelist?

                        if (kind && body) {
                            $node.data('body', body);
                            $node.data('kind', kind);
                            $node.data('isCustom', ($node.hasAttr('ant-item-content')) ? true:false);

                            $allNodes = $allNodes.add($node);   
                        }
                    }

                });

                var hashList = {};

                //run init outside the loop for optimization to avoid many reflows
                // var indicatorInitQueue = [];

                $allNodes.each(function(){
                    var $this = $(this),
                        body = $this.data('body'),
                        kind = $this.data('kind'),
                        isCustom = $this.data('isCustom'),
                        HTMLkind = $this.get(0).nodeName.toLowerCase(),
                        hashBody = body,
                        hash,
                        oldHash,
                        hashText;

                    // redundant, from above, so removing:
                    // if ( $this.closest('.no-ant').length ) {
                    //     return;
                    // }
                    
                    if ( (kind == "img" || kind == "media") && body ) {

                        // band-aid for old image hashing technique.  bandaid.  remove, hopefully.
                        hashText = "rdr-"+kind+"-"+hashBody; //examples: "ant-img-http://dailycandy.com/images/dailycandy-header-home-garden.png" || "ant-p-ohshit this is some crazy text up in this paragraph"
                        oldHash = ANT.util.md5.hex_md5( hashText );
                        $this.data('oldHash', oldHash);

                        // now, handle "new hash"... which accounts for rotating subdomains (i.e., differing CDN names for image hosts)

                        // regex from http://stackoverflow.com/questions/6449340/how-to-get-top-level-domain-base-domain-from-the-url-in-javascript
                        // modified to support 2 character suffixes, like .fm or .io
                        var HOSTDOMAIN = /[-\w]+\.(?:[-\w]+\.xn--[-\w]+|[-\w]{2,}|[-\w]+\.[-\w]{2})$/i;
                        var srcArray = hashBody.split('/');

                        srcArray.splice(0,2);

                        var domainWithPort = srcArray.shift();
                        
                        //this could be undefined if the url not valid or is something like javascript:void
                        if(!domainWithPort){
                            return;
                        }
                        var domain = domainWithPort.split(':')[0]; // get domain, strip port
             
                        var filename = srcArray.join('/');

                        // test examples:
                        // var match = HOSTDOMAIN.exec('http://media1.ab.cd.on-the-telly.bbc.co.uk/'); // fails: trailing slash
                        // var match = HOSTDOMAIN.exec('http://media1.ab.cd.on-the-telly.bbc.co.uk'); // success
                        // var match = HOSTDOMAIN.exec('media1.ab.cd.on-the-telly.bbc.co.uk'); // success
                        var match = HOSTDOMAIN.exec( domain );
                        if (match == null) {
                            return;
                        } else {
                            hashBody = match[0] + '/' + filename;
                        }

                        var queryStringDomains = [
                            'soundcloud.com'
                        ];

                        $.each(queryStringDomains, function(idx, domain) {
                            if (hashBody.indexOf(domain) != -1) {
                                ANT.group.media_url_ignore_query = false;   
                            }

                        });
                        if ( ANT.group.media_url_ignore_query && hashBody.indexOf('?') ){
                            hashBody = hashBody.split('?')[0];
                        }

                        // if this got 'ant-oldhash' class down in the /api/summary/containers/ call, then use that hash, don't regenerate it
                        if ( $this.hasAttr('ant-oldhash') ) {
                            hash = $this.data('hash');
                        } else {
                        //it didn't have oldhash, so it's an image no one has reacted to yet
                            hashText = "rdr-"+kind+"-"+hashBody;
                            hash = ANT.util.md5.hex_md5( hashText );
                        }
                    } else {
                        if(!body){
                          return;
                        }

                        hashText = "rdr-"+kind+"-"+body;
                        hash = ANT.util.md5.hex_md5( hashText );

                        if ( !$this.hasAttr('ant-hash') )  {
                            var iteration = 1;
                            while ( typeof ANT.summaries[hash] != 'undefined' ) {
                                hashText = "rdr-"+kind+"-"+body+"-"+iteration;
                                hash = ANT.util.md5.hex_md5( hashText );
                                iteration++;
                            }
                        }

                    }

                    // ok we have a hash now
                    if ( $this.hasAttr('ant-hash') && $this.attr('ant-hash') != hash )  {
                        ANT.actions.removeHashes( $this );
                    }

                    // prevent the identical nested elements being double-hashed bug
                    // like <blockquote><p>Some quote here</p></blockquote>
                    // we want the deepest-nested block element to get the hash, so the indicator appears next to the text
                    // if ( $this.parents('[ant-hash="'+hash+'"]').length ) {
                    //     var $parentNodes = $this.parents('[ant-hash="'+hash+'"]');
                    //     ANT.actions.stripAntNode($parentNodes);
                    // }

                    // prevent nested block element parents from having a hash?
                    var $hashParents = $this.parents('[ant-hash]');
                    if ( $hashParents.length ) {
                        ANT.actions.stripAntNode($hashParents);
                    }

                    // we will use this in the following conditionals
                    var thisTagName = $this.get(0).nodeName.toLowerCase();

                    // check to see if this is an IMG inside a hashed node.  if so, check this thing for siblings.
                    // if no siblings... make sure the parent does not have a hash or they may be identical
                    // both HTML and text.
                    // update 7/2014:  stunningly, this applies to body tag, and apparently, we want that.
                    if ( thisTagName == 'img' ) { 
                        if ( $hashParents.length && !$this.siblings(ANT.group.anno_whitelist).length ) {
                            // var $parentNodes = $this.parents('[ant-hash]');
                            ANT.actions.stripAntNode($hashParents);
                        }
                    }

                    // prevent two indicators for content when there are nested block elements
                    // only hash and insert an indicator for the deepest node
                    // to begin, check the node we are hasing (hashNode) for any nested elements from the Allowed Tags (anno_whitelist) setting
                    if ( $this.find(ANT.group.anno_whitelist).length ) {
                        var dontHash = false;

                        // loop through the Allowed Tags that are nested inside the hashNode
                        $this.find(ANT.group.anno_whitelist).each(function(idx, childNode) {


                            var tagName = childNode.nodeName.toLowerCase(),
                                embedTagsArray = ['img','iframe','embed'];

                            // if this node, inside the hashNode, is an image, iframe, or embed...
                            // check to see if ti has any valid siblings (in case, say, the image is floated next to a paragraph)
                            if ( isCustom || $.inArray(tagName, embedTagsArray) != -1 ) {
                                // var $childNode = $(childNode);
                                // if ($childNode.siblings(ANT.group.anno_whitelist).length ) {
                                // }

                            } else {
                                dontHash = true;
                            }
                        });

                        if (dontHash===true) { 
                            // ANT.actions.stripAntNode($this);
                            return;
                        }
                    }

                    // add an object with the text and hash to the ANT.containers dictionary
                    //todo: consider putting this info directly onto the DOM node data object
                    ANT.actions.containers.save({
                        body:body,
                        kind:kind,
                        hash:hash,
                        HTMLkind:HTMLkind,
                        $this: $this
                    });

                    // add a CSS class to the node that will look something like "ant-207c611a9f947ef779501580c7349d62"
                    // this makes it easy to find on the page later

                    //don't do this here - do it on success of callback from server
                    // [ porter ]  DO do it here, need it for sendHashes, which needs to know what page it is on, and this is used to find out.
                    $this.attr( 'ant-hash', hash ).attr('ant-node', 'true').attr( 'ant-hashed', true );

                    if ( HTMLkind != 'body' && !isTouchBrowser ) {
                        // // todo: touchHover
                        
                        $this.on('mouseenter.ant', function() {
                            // ANT.actions.indicators.init(hash);
                            var $this = $(this);
                            ANT.util.setFunctionTimer( function() {
                            // setTimeout(function(){
                                $this.addClass('ant_live_hover');
                            },300, hash);
                        })//chain
                        .on('mouseleave.ant', function() {
                            // var $hash_helper = $('.ant_helper_aWindow.ant_for_'+hash);
                            // if ( $hash_helper.length ) {
                            //     $hash_helper.remove();
                            // }
                            // $(this).removeClass('ant_live_hover');
                            var $this = $(this);
                            ANT.util.setFunctionTimer( function() {
                            // setTimeout(function(){
                                $this.removeClass('ant_live_hover');
                            },300, hash);
                        });

                    }

                    var summary = ANT.actions.summaries.init(hash);
                    ANT.actions.summaries.save(summary);

                    // indicatorInitQueue.push(hash);

                    var page_id = ANT.util.getPageProperty('id', hash );
                    if ( !hashList[ page_id ] ) hashList[ page_id ] = [];

                    hashList[ page_id ].push(hash);
                    $this.data('hash', hash); //todo: consolidate this with the ANT.containers object.  We only need one or the other.

                });
    
                // perfimprove
                // $.each(indicatorInitQueue, function(idx, hash){
                //     ANT.actions.indicators.init(hash);
                // });

                return hashList;
            },
            sendHashes: function( hashesByPageId, onSuccessCallback ) {
                // ANT.actions.sendHashes:

                var hashList = [];
                $.each(hashesByPageId, function(pageId, hashList){
                    //might not need to protect against this anymore.
                    if(!pageId || typeof hashList != "object" ){
                        //im guessing this will never happen - test for a while and elliminate.
                        ANT.safeThrow("No more messy hashes allowed!!");
                        return;
                    }

                    var $pageContainer = $('[ant-page-container="'+pageId+'"]');

                    $.each( $pageContainer.find('[ant-item]'), function( idx, node ) {
                        var $node = $(node);

                        if ( typeof $node.data('ant-hashed') == "undefined" ) {
                            var thisHash = $node.attr('ant-hash');

                            hashList = $.grep(hashList, function(value) {
                              return value != thisHash;
                            });

                            if (typeof thisHash != 'undefined') {
                                hashList.push( thisHash );
                            }

                            //init the cross page containers so even the ones that come back with 0 reactions will
                            //have write mode enabled
                            ANT.actions.indicators.init(thisHash);
                            $node.data('ant-hashed', true);
                            // $node.data('ant-hashed-one', true); // on load.  for debug only.
                        }
                    });

                    $.each(hashList, function(idx, hash){

                        //might not need to protect against this anymore.
                        if (typeof hash != "string" ){
                            ANT.safeThrow("why is your hash not a string!?");
                            return;
                        }

                        var $hashable_node = $pageContainer.find('[ant-hash="' + hash +'"]');

                        if ($hashable_node.length == 1 ) {
                            $hashable_node.attr('ant-hashed', true);
                            // $hashable_node.attr('ant-hashed-two', true); // on select.  for debug only.
                        } else {
                            // remove the hash, it is not in this 'page'
                            var removeIndex = hashList.indexOf(hash);
                            if (removeIndex > -1) {
                                hashList.splice(removeIndex, 1);
                            }
                        }
                    });
                    
                    var pageIdToInt = parseInt( pageId, 10);
                    
                    if(isNaN(pageIdToInt)){
                        ANT.safeThrow("why is the pageID NAN ??: "+ pageId + "-->" + pageIdToInt);
                    }

                    // get crossPage containers (which may/may not also be custom display)
                    // they need to be initialized by this point (ant-hashed)
                    var crossPageHashes = [];
                    $.each( $('[ant-crossPageContent="true"]'), function( idx, node ) {
                        var thisHash = $(node).attr('ant-hash');
                        crossPageHashes.push( thisHash );

                        hashList = $.grep(hashList, function(value) {
                          return value != thisHash;
                        });

                        //init the cross page containers so even the ones that come back with 0 reactions will
                        //have write mode enabled
                        ANT.actions.indicators.init(thisHash);
                    });

                    // debug:
                    // var crossPageHashes = ["fcd4547dcaf3699886587ab47cb2ab5e"];

                    ANT.actions.sendHashesForSinglePage({
                       short_name : ANT.group.short_name,
                       pageID: pageIdToInt,
                       hashes: hashList,
                       crossPageHashes:crossPageHashes
                    }, onSuccessCallback);
                
                });
            },
            sendHashesForSinglePage: function(sendData, onSuccessCallback){
                // ANT.actions.sendHashesForSinglePage:
                if (ANT.status.page === true) {

                    var pageId = sendData.pageID;

                    // send the data!
                    $.ajax({
                        url: ANT_baseUrl+"/api/summary/containers/",
                        type: "get",
                        contentType: "application/json",
                        dataType: "jsonp",
                        data: {
                            json: $.toJSON(sendData)
                        },
                        success: function(response) {
                            if ( typeof response != "undefined" && typeof response.data != "undefined" ) {
                                // making known items a global, so we can run a init them later.  doing so now will prevent data from being inserted.
                                if (typeof response.data.known != "undefined" ) {
                                    ANT.known_hashes = response.data.known;
                                }

                                // add the cross-page hashes to the known_hashes obj so that its reaction info gets inserted!
                                if ( typeof response.data.crossPageKnown != "undefined" ) {
                                    if (typeof response.data.known != "undefined" ) {
                                        ANT.known_hashes = $.extend( ANT.known_hashes, response.data.crossPageKnown );
                                    }
                                    ANT.crosspage_hashes = response.data.crossPageKnown;
                                }

                                // if a crosspage container has no reactions, it isn't returned in the "crossPageKnown" object
                                // but we still want to do an init of the node... so we make dummy objects
                                // this is so we can init the nodes down below when we call
                                // ANT.actions.containers.initCustomDisplayHashes(response.data.crossPageKnown);
                                $.each( $('[ant-crossPageContent="true"]'), function( idx, node ) {
                                    var thisHash = $(node).attr('ant-hash');
                                    var dummySummaryObject = {
                                            "hash":thisHash,
                                            "counts": {
                                                "coms": 0, 
                                                "tags": 0, 
                                                "interactions": 0
                                            }, 
                                            "top_interactions": {
                                                "coms": [], 
                                                "tags": {}
                                            }
                                        }
                                    if (typeof ANT.crosspage_hashes != "undefined" ) {
                                        ANT.crosspage_hashes = {};
                                    }
                                    ANT.crosspage_hashes[thisHash] = dummySummaryObject;
                                });

                                var summaries = {};
                                summaries[ pageId ] = response.data.known;
                                
                                $.each(response.data.unknown, function(idx, hash){
                                    if (typeof hash != "string") {
                                        ANT.safeThrow('why would this not be a string?');
                                        return;
                                    }

                                    var unknown_summary;
                                    // get the kind
                                    var $node = $('[ant-hash="'+hash+'"]');
                                    var kind = $node.data('kind');
                                    if(!kind){
                                        ANT.safeThrow('node should always have data: kind');
                                    }
                                    unknown_summary = ANT.util.makeEmptySummary( hash, kind );

                                    summaries[ pageId ][ hash ] = unknown_summary;
                                });

                                // [ porter ]: since we're not storing containers anymore, just setup all hashes regardless of "known" status
                                if ( !$.isEmptyObject(summaries) ){
                                    //setup the summaries
                                    ANT.actions.containers.setup(summaries);

                                    //the callback verifies the new container and draws the actionbar
                                    //wont get run if this single hash is unknown.
                                    if(typeof onSuccessCallback !== 'undefined'){
                                        onSuccessCallback();
                                    }
                                }

                                var initSomeHashes = [];
                                $.each( response.data.crossPageKnown , function(idx, hashObject) {
                                    if ( initSomeHashes.indexOf(hashObject.hash) == -1 ) {
                                        initSomeHashes.push(hashObject.hash);
                                    }
                                });

                                // init the custom display / separate_cta elements
                                $.each( $('[ant-item]') , function(idx, node) {
                                    if ( initSomeHashes.indexOf($(node).data('hash')) == -1 ) {
                                        initSomeHashes.push( $(node).data('hash') );
                                    }
                                });

                                ANT.actions.containers.initCustomDisplayHashes( initSomeHashes );
                            }
                        }
                    });
                }
                
            },
            removeHashes: function($nodes) {
                // ANT.actions.removeHashes:
                if (!$nodes) {
                    $nodes = $('[ant-item]');
                }

                $nodes.each( function( idx, node ) {
                    var $node = $(node);
                    $node.removeAttr('ant-hash').removeAttr('ant-hasindicator').removeAttr('ant-node').removeAttr('ant-hashed').removeAttr('ant-summary-loaded');
                });
            },
            removeSubdomainFromPageUrl: function(url) {
                // ANT.actions.removeSubdomainFromPageUrl:
                // if "ignore_subdomain" is checked in settings, AND they supply a TLD,
                // then modify the page and canonical URLs here.
                // have to have them supply one because there are too many variations to reliably strip subdomains  (.com, .is, .com.ar, .co.uk, etc)
                if (ANT.group.ignore_subdomain == true && ANT.group.page_tld) {
                    var HOSTDOMAIN = /[-\w]+\.(?:[-\w]+\.xn--[-\w]+|[-\w]{2,}|[-\w]+\.[-\w]{2})$/i;
                    var srcArray = url.split('/');

                    var protocol = srcArray[0];
                    srcArray.splice(0,3);

                    var returnUrl = protocol + '//' + ANT.group.page_tld + '/' + srcArray.join('/');

                    return returnUrl;
                } else {
                    return url;
                }
            },
            hashCustomDisplayHashes: function() {
                // ANT.actions.hashCustomDisplayHashes:
                var pageCustomDisplays = {},
                    pageId = ANT.util.getPageProperty();
                
                pageCustomDisplays[ pageId ] = [];
                if ( $('[ant-item]:not([ant-hash])').length ) {
                    // should we find custom-display nodes and add to the hashList here?
                    $.each( $('[ant-item]'), function( idx, node ) {
                        var $node = $(node);
                        ANT.actions.hashNodes( $node );
                        var thisHash = $node.attr('ant-hash');

                        pageCustomDisplays[ pageId ].push( thisHash );

                        ANT.actions.indicators.init( thisHash );
                        ANT.actions.mediaNodeInit($node);
                    });

                }

                if (pageCustomDisplays[ pageId ].length) {
                    ANT.actions.sendHashes( pageCustomDisplays );
                }
            },
            comments: {
                makeCommentBox: function(settings, options){
                    // ANT.actions.comments.makeCommentBox
                    var content_node = settings.content_node,
                        tag = settings.tag,
                        summary = settings.summary,
                        hash = settings.hash,
                        kind = settings.kind,
                        $aWindow = settings.$aWindow,
                        selState = settings.selState;

                    options = options || {};

                    var helpText = options.helpText || ANT.t('add_comment');
                    
                    //not used any more
                    var cta = options.cta || ANT.t('comment');

                    var $commentBox = $('<div class="ant_commentBox ant_clearfix"></div>');

                    //todo: combine this with the other make comments code
                    var $commentDiv =  $('<div class="ant_comment">'),
                        $commentTextarea = $('<textarea class="ant_default_msg">' +helpText+ '</textarea>'),
                        $ant_charCount =  $('<div class="ant_charCount">'+ ANT.t('characters_left').replace('NNN', ANT.group.comment_length ) +'</div>'),
                        $submitButton =  $('<button class="ant_commentSubmit">'+ANT.t('comment')+'</button>');

                    $commentDiv.append( $commentTextarea, $ant_charCount, $submitButton );

                    $commentTextarea.focus(function(){
                        // ANT.events.track('start_comment_lg::'+content_node.id+'|'+tag.id);
                        $(this).removeClass('ant_default_msg');
                        if( $(this).val() == helpText ){
                            $(this).val('');
                        }
                    }).blur(function(){
                        var val = $(this).val();
                        if( val === "" || val === helpText ){
                            $(this).addClass('ant_default_msg');
                            $(this).val( helpText );
                        }
                    }).keyup(function(event) {
                        var commentText = $commentTextarea.val();
                        if (event.keyCode == '27') { //esc
                            $(this).blur();
                            // return false so the aWindow doesn't close.
                            return false;
                        } else if ( commentText.length > ANT.group.comment_length ) {
                            commentText = commentText.substr(0, ANT.group.comment_length);
                            $commentTextarea.val( commentText );
                        }
                        $commentTextarea.siblings('div.ant_charCount').text( ANT.t('characters_left').replace('NNN', ( ANT.group.comment_length - commentText.length ) ) );
                    });

                    $submitButton.click(function(e) {
                        //add what we need to settings:
                        $.extend(settings, {
                            $commentTextarea: $commentTextarea,
                            helpText: helpText
                        });

                        ANT.actions.comments.submitComment(settings);
                    });

                    $commentBox.append( $commentDiv );
                    return $commentBox;
                
                },
                submitComment: function(settings){
                    // ANT.actions.comments.submitComment
                    var $commentTextarea = settings.$commentTextarea,
                        helpText = settings.helpText,
                        content_node = settings.content_node,
                        summary = settings.summary,
                        kind= settings.kind,
                        hash = settings.hash,
                        tag  = settings.tag ,
                        $aWindow = settings.$aWindow,
                        selState = settings.selState;

                    var commentText = $commentTextarea.val();

                    //keyup doesn't guarentee this, so check again (they could paste in for example);
                    if ( commentText.length > ANT.group.comment_length ) {
                        commentText = commentText.substr(0, ANT.group.comment_length);
                        $commentTextarea.val( commentText );
                        $commentTextarea.siblings('div.ant_charCount').text( ANT.t('characters_left').replace('NNN', ( ANT.group.comment_length - commentText.length ) ) );
                    }

                    if ( commentText != helpText ) {
                        //temp translations..
                        //quick fix.  images don't get the data all passed through to here correctly.
                        //could try to really fix, but hey.  we're rewriting soon, so using this hack for now.
                        if ($.isEmptyObject(content_node) && summary.kind=="img") {
                            content_node = {
                                "body":$('img.ant-'+summary.hash).get(0).src,
                                "kind":summary.kind,
                                "hash":summary.hash
                            };

                        }
                        var args = {  hash:hash, content_node_data:content_node, comment:commentText, content:content_node.body, tag:tag, aWindow:$aWindow, selState:selState};

                        //leave parent_id undefined for now - backend will find it.
                        ANT.actions.interactions.ajax( args, 'comment', 'create');

                    } else {
                        $commentTextarea.focus();
                    }
                    return false; //so the page won't reload
                }
            },
            containers: {
                updateCrossPageHash: function(hash){
                    //ANT.actions.containers.updateCrossPageHash:
                    var isCrossPageContainer = $('[ant-hash="'+hash+'"]').length > 0;
                    if(!isCrossPageContainer){
                        return;
                    }

                    //changing this to copy out and just call only parts of the initCrossPageHashes call below
                    ANT.actions.indicators.init(hash, true);

                    // no longer doing the ProPublica-style open-on-page grid
                    // var $container = $('[ant-hash="'+hash+'"]'),
                        // customDisplayName = $container.attr('ant-item');
                        // $grid = $('[ant-view-reactions-for="'+customDisplayName+'"]');

                    // if ($grid.length) {
                    //     ANT.actions.content_nodes.init(hash, function() {
                    //         ANT.actions.indicators.utils.makeTagsListForInline( $grid, false );
                    //         $grid.jScrollPane({ showArrows:true,contentWidth: '0px' });
                    //     });
                    // }
                },
                initCustomDisplayHashes: function(hashesToInit){
                    // go ahead and initialize the content nodes for custom display elements
                    // we might want to do this different with an HTML attribute, or something.  
                    // basically, this has to be done if the REACTION-VIEW (formerly: tag grid) is open on load.

                    $.each( hashesToInit, function(idx, hash) {
                        var $node = $('[ant-hash="'+hash+'"]');

                        // var hash = hashObject.hash;
                        if (typeof hash != "undefined" && typeof $node.attr('ant_summary_loaded') == "undefined" ) {
                            ANT.actions.indicators.init(hash);
                            ANT.summaries[hash].crossPage=true;
                            ANT.actions.content_nodes.init(hash);

                            // init a reaction-view for an open custom display thing.
                            // i know, this should be abstracted.  it's too ProPublica specific.  
                            // needs abstraction, and conditionals to determine what to do based on the display properties.
                            // var $container = $('[ant-hash="'+hash+'"]'),
                                // customDisplayName = $container.attr('ant-item'),
                                // $indicator = summary.$indicator = $container, // might work?  $indicator is storing important data...
                                // $counter = $('[ant-counter-for="'+customDisplayName+'"]'),
                                // $reactionView = $('[ant-view-reactions-for="'+customDisplayName+'"]'),
                                // reactionViewWidth = $reactionView.width(),
                                // reactionViewHeight = $reactionView.height();

                            // $reactionView.data('hash', hash).data('container', hash).addClass('no-ant');

                            //     // if the reactionView grid has no height specified, give it one
                            //     // [pb, 9/12/13]:  think the 200px minimum is to make it look ok.  nt sure if it BREAKS if it's smaller than that or not.
                            //     if ( reactionViewHeight < 200 ) { reactionViewHeight = 200; $reactionView.height(reactionViewHeight); }

                            //     ANT.util.cssSuperImportant( $reactionView, { height:reactionViewHeight+"px" });

                            //     if ($reactionView.length) {
                            //         // since currently, our reactionView needs to have a width that's a factor of 100... force that:
                            //         var statedWidthDividedBy100 = parseInt( reactionViewWidth / 100 );
                                    
                            //         reactionViewWidth = statedWidthDividedBy100 * 100;
                            //         if ( reactionViewWidth > 600 ) { reactionViewWidth=600; }

                            //         // ANT.util.cssSuperImportant( $reactionView, { width:reactionViewWidth+"px" });
                            //         if ( !$reactionView.closest('.ant_reactionView_wrapper').length ) {
                            //             $reactionView.wrap('<div class="ant_reactionView_wrapper" style="width:'+reactionViewWidth+'px;height:'+reactionViewHeight+'px;"></div>')
                            //         }

                            //         // can the header stuff be optional?
                            //         $reactionView.addClass('w'+reactionViewWidth).html('<div class="ant ant_window ant_inline w'+reactionViewWidth+' ant_no_clear" style="position:relative !important;"><div class="ant ant_header"><div class="ant_loader"></div><div class="ant_indicator_stats"><span class="ant-antenna-logo"></span><span class="ant_count"></span></div><h1>'+ANT.t('reactions')+'</h1></div><div class="ant ant_body_wrap ant_grid ant_clearfix"></div></div>');
                            //         ANT.actions.content_nodes.init(hash, function() { ANT.actions.indicators.utils.makeTagsListForInline( $reactionView, false ); $reactionView.jScrollPane({ showArrows:true,contentWidth: '0px' }); } );
                            //     } else {
                            //     }
                            
                        }
                    });
                },
                media: {
                    //ANT.actions.containers.media:
                    //actions for the special cases of media containers
                    onEngage: function(hash){
                        // deprecated?
                        return;
                        //ANT.actions.containers.media.onEngage:
                        // action to be run when media container is engaged - typically with a click on the indicator

                        // var $this = $('img[ant-hash="'+hash+'"], iframe[ant-hash="'+hash+'"],embed[ant-hash="'+hash+'"],video[ant-hash="'+hash+'"],object[ant-hash="'+hash+'"]').eq(0),
                        //     $indicator = $('#ant_indicator_'+hash),
                        //     $indicator_details = $('#ant_indicator_details_'+hash);

                        // var hasBeenHashed = $this.hasAttr('ant-hashed'),
                        //     isBlacklisted = $this.closest('.ant, .no-ant').length;

                        // var containerInfo = ANT.containers[hash];
                        // if ( containerInfo ) {
                        //     var $mediaItem = containerInfo.$this;

                        //     $mediaItem.data('hover',true).data('hash', hash);
                        //     ANT.actions.indicators.utils.updateContainerTracker(hash);
                        //     ANT.aWindow.mediaAWindowShow( $mediaItem );
                        //     // $indicator_details.addClass('ant_has_border');
                        // }

                        // deprecated - see above
                        // ANT.events.track( 'view_node::'+hash, hash );
                    },
                    onDisengage: function(hash){
                        // deprecated?
                        return;

                        //ANT.actions.containers.media.onDisengage:
                        //actions to be run when media container is disengaged - typically with a hover off of the container
                        // var $mediaItem = $('img[ant-hash="'+hash+'"], iframe[ant-hash="'+hash+'"],embed[ant-hash="'+hash+'"],video[ant-hash="'+hash+'"],object[ant-hash="'+hash+'"]').eq(0),
                        //     $indicator = $('#ant_indicator_'+hash),
                        //     $indicator_details = $('#ant_indicator_details_'+hash);

                        // var timeoutCloseEvt = $mediaItem.data('timeoutCloseEvt_'+hash);
                        // clearTimeout(timeoutCloseEvt);

                        // timeoutCloseEvt = setTimeout(function(){
                        //     var containerInfo = ANT.containers[hash];
                        //     if ( containerInfo ) {
                        //         $mediaItem.data('hover',false).data('hash', hash);
                        //         ANT.aWindow.mediaAWindowHide( $mediaItem );
                        //     }
                        // },100);
                        // $mediaItem.data('timeoutCloseEvt_'+hash, timeoutCloseEvt);
                    },
                    disengageAll: function(){
                        //ANT.actions.containers.media.disengageAll:

                        //only need to run this for containers that are active
                        var hashes = [];
                        $('.ant_live_hover').each(function(){
                            var hash = $(this).data('hash');
                            hashes.push(hash);
                            ANT.actions.containers.media.onDisengage(hash);
                        });

                        $('.ant_indicator_for_media').each(function() {
                            var $this = $(this),
                                thisHash = $this.attr('id').substr(14),
                                hashedItem = document.querySelectorAll('[ant-hash="'+thisHash+'"]')[0],
                                visible = true;

                            var nodes = [];
                            nodes.push(hashedItem);
                            while(hashedItem && hashedItem.parentNode) {
                                nodes.unshift(hashedItem.parentNode);

                                hashedItem = hashedItem.parentNode;

                                // check this node's visibility
                                if (hashedItem.offsetParent && hashedItem.offsetParent === null) { 
                                    visible = false;
                                }

                                if (typeof hashedItem.style != 'undefined') {
                                    var opacity = parseFloat(hashedItem.style.opacity);
                                    if ( !isNaN( opacity ) && opacity < 1 ) { 
                                        visible = false;
                                    }
                                }
                                
                                nodes.unshift(hashedItem);
                                hashedItem = hashedItem.parentNode;
                            }

                            // if not a visible media item, remove this indicator.  it'll get restored later.
                            if (visible != true) {
                                $this.parent().remove();
                            }

                        });
                    }
                },
                save: function(settings){
                    //ANT.actions.containers.save:
                    //makes a new one or returns existing one
                    //expects settings with body, kind, and hash.
                    if( ANT.containers.hasOwnProperty(settings.hash) ) return ANT.containers[settings.hash];
                    //else
                    var pageId = ( typeof settings.id === 'undefined' || settings.id === null ) ? null : settings.id;

                    var container = {
                        'id': pageId,
                        'body': settings.body || null,
                        'kind': settings.kind,
                        'hash': settings.hash,
                        'HTMLkind': settings.HTMLkind || null,
                        '$this': settings.$this || null
                    };
                    ANT.containers[settings.hash] = container;
                    return container;
                },
                setup: function(summariesPerPage){
                    //ANT.actions.containers.setup:
                    //then define type-specific setup functions and run them
                    var _setupFuncs = {
                        img: function(hash, summary){

                            var containerInfo = ANT.containers[hash];
                            var $container = containerInfo.$this;

                            //generate the content_node for this image container.  (the content_node is just the image itself)
                            //todo: I'm pretty sure it'd be more efficient and safe to run on image hover, or image indicator click.
                            var body = $container[0].src;

                            var content_node_data = {
                                'body': body,
                                'kind':summary.kind,
                                'container': hash, //todo: Should we use this or hash?
                                'hash':hash
                            };

                            ANT.content_nodes[hash] = content_node_data;
                            ANT.aWindow.update(hash);

                            //#touchBrowserMediaInit
                            if(isTouchBrowser){
                                ANT.actions.content_nodes.init(hash, function(){});
                                ANT.actions.indicators.init(hash);
                            }
                        },
                        media: function(hash, summary){
                            //for now, just pass through to img.
                            this.img(hash, summary);
                        },
                        text: function(hash, summary){
                            if(isTouchBrowser){
                                ANT.actions.content_nodes.init(hash, function(){});
                                ANT.actions.indicators.init(hash);
                            }
                        },
                        custom: function(hash, summary){

                        }
                    };

                    //todo: what does this do?  break this out into a function with a descriptive name.
                    var hashesToShow = []; //filled below

                    $.each(summariesPerPage, function(page_id, summariesByHash){
                        
                        if ( !summariesByHash || $.isArray(summariesByHash) ){
                            ANT.safeThrow('For godsake no. This should not be an array of hashes and it should not be the bastard cruft of some frankenpage object.');
                            return;
                        }

                        $.each(summariesByHash, function(hash, summary){
                            
                            //first do generic stuff
                            //save the hash as a summary attr for convenience.
                            summary.hash = hash;

                            var containerInfo = ANT.containers[hash];

                            if ( containerInfo) {
                                var $container = containerInfo.$this;

                                //temp type conversion for top_interactions.coms;
                                var newComs = {},
                                    coms = summary.top_interactions.coms;

                                $.each(coms, function(arrIdx, com){
                                    //sortby tag_id

                                    // [ porter ] this shouldn't be needed, but it is,
                                    // because the correct comment set, for text, is actually found in summary.content_nodes.top_interactions, which does not exist for images
                                    if ( summary.kind == "text") {
                                        newComs[com.tag_id] = com;
                                    } else {
                                        if ( !newComs[com.tag_id] ) newComs[com.tag_id] = [];
                                        newComs[com.tag_id].push(com);
                                    }
                                });

                                summary.top_interactions.coms = newComs;
                                ANT.actions.summaries.save(summary);

                                var pageContainerExists = false;

                                $.each( ANT.pages[ page_id ].containers, function(idx, definedPageContainer) {
                                    if ( definedPageContainer.hash == hash ) { pageContainerExists = true; }
                                });
                                if ( pageContainerExists == false ) {
                                    ANT.pages[ page_id ].containers.push({ "hash":hash, "id":summary.id });
                                } else {
                                }

                                // ANT.actions.indicators.update( hash, true);


                                //now run the type specific function with the //run the setup func above
                                var kind = summary.kind;
                                if(kind != "page"){
                                    _setupFuncs[kind](hash, summary);
                                }

                                //note:all of them should have interactions, because these are fresh from the server.  But, check anyway.
                                //if(summary.counts.interactions > 0){ //we're only showing tags for now, so use that instead.
                                if(summary.counts.tags > 0){
                                    hashesToShow.push(hash);
                                }
                            }
                        });
                    });

                    // create the container sort to see which containers have the most activity
                    ANT.actions.summaries.sortPopularTextContainers();

                    $.each( ANT.known_hashes, function(returnedHash, obj) {
                        // band-aid.  bandaid.
                        // we're going to iterate through images to see if there is an old hash
                        var $hash_is_an_img = $('img[ant-node="returnedHash"]');
                        if ( $hash_is_an_img.length ) {
                            if ( $hash_is_an_img.data('oldHash') == returnedHash ) {
                                // remove the class with the 'new' hash, add a class with the 'old' hash, and set the current hash to the 'old' one
                                $hash_is_an_img.attr('ant-hash', returnedHash).attr('ant-oldhash','true').data('hash', returnedHash);
                            }
                        }

                        // now init the indicators
                        ANT.actions.indicators.init(returnedHash);
                    });

                    ANT.actions.indicators.show(hashesToShow);
                    ANT.actions.summaries.displayPopularIndicators();
                },
                send: function(hashList, onSuccessCallback){
                    //ANT.actions.containers.send:
                    // gets the containers from the hashList
                    // and cuts them up into delicious bite-sized chunks
                    // to ensure that the ajax sendData isn't over 2000 chars.

                    var containers = {},
                    curLen = 0,
                    proposedLen = 0,
                    thisLen,
                    tempEncode,
                    bodyCharLimit = 300, //todo: make this nicer - see below
                    charLimit = 1400; //keep it safely under 2000 to allow for header;

                    $.each( hashList, function(idx, hash){
                        //container is {body:,kind:,hash:}
                        var container = ANT.containers[hash];

                        //quick fix - copy the container object but without the $this obj
                        //for now we're just not sending the body
                        var sendContainer = {
                            HTMLkind: container.HTMLkind,
                            body: "",
                            //body: container.body,
                            hash: container.hash,
                            id: container.id,
                            kind: container.kind
                        };

                        tempEncode = encodeURIComponent ( $.toJSON(sendContainer) );

                        thisLen = tempEncode.length;

                        //todo: solve for this.  We don't expect to see this though.
                        if(thisLen > charLimit){


                            //container chunk solution for later.  For now, just dissalow this container.
                            /*
                            var body = container.body,
                                fragment,
                                incr = 0,
                                bodyParts = [],
                            while( body.length ){
                                incr += bodyCharLimit;
                                fragment = body.slice(incr);
                                if(fragment){
                                    bodyParts.push[fragment];
                                }
                            }

                            $.each(function(idx, partialBody){

                                sendContainer = {
                                    HTMLkind: container.HTMLkind,
                                    partialBody: partialBody,
                                    partialBodyIdx: idx,
                                    partialBodyIdx: idx,
                                    hash: container.hash,
                                    id: container.id,
                                    kind: container.kind
                                };
                                containers[hash] = sendContainer;
                                ANT.actions.containers._ajaxSend(sendContainer);
                            });
                            */

                            //signals the call to not save this container
                            sendContainer = false;
                        }
                        else{
                            proposedLen += thisLen;
                            if(proposedLen > charLimit){
                                //send the existing set that is curLen, not proposedLen

                                ANT.actions.containers._ajaxSend(containers);
                                resetChunks();
                            }
                            containers[hash] = sendContainer;
                            curLen += thisLen;

                        }

                    });
                    //do one last send.  Often this will be the only send.
                    if( ! $.isEmptyObject(containers) ) {
                        ANT.actions.containers._ajaxSend(containers, onSuccessCallback);
                    }

                    //helper functions
                    function resetChunks(){
                        containers = {};
                        curLen = 0;
                        proposedLen = 0;
                    }
                },
                _ajaxSend: function(containers, onSuccessCallback){
                    //ANT.actions.containers._ajaxSend:
                    //this is a helper for this.send:
                    //don't call this directly! Always use this.send so you don't choke on your ajax.

                    var sendData = containers;

                    // TODO do we even need this anymore?
                    $.ajax({
                        url: ANT_baseUrl+"/api/containers/create/",
                        type: "get",
                        contentType: "application/json",
                        dataType: "jsonp",
                        data: {
                            json: $.toJSON(sendData)
                        },
                        success: function(response) {
                            var savedHashes = response.data;
                            //savedHashes is in the form {hash:id}

                            //a dict for dummy zero'ed out summaries for containers.setup below
                            var dummySummaries = {};

                            $.each( savedHashes, function(hash, id){
                                //todo: we prob don't need to check with the bool - Tyler, do we need this?
                                if( !id ){
                                    return;
                                }
                                //else
                                var node = ANT.containers[hash];
                                node.id = id;
                                dummySummaries[hash] = ANT.actions.summaries.init(hash);
                            });

                            ANT.actions.containers.setup(dummySummaries);

                            //the callback verifies the new container and draws the actionbar
                            //this only gets called when a single hash gets passed through all the way from startSelect
                            if(typeof onSuccessCallback !== 'undefined'){
                                onSuccessCallback();
                            }

                        }
                    });
                }
            },
            content_nodes: {
                make: function(settings){
                    //ANT.actions.content_nodes.make:

                    //makes a new one or returns existing one
                    //expects settings with container, body, and location.

                    var hash = settings.hash;

                    var content_node_key;
                    if (settings.location){
                        content_node_key = settings.container+"-"+settings.location;
                    }
                    else{
                        content_node_key = settings.container;
                    }

                    if( ANT.content_nodes.hasOwnProperty(content_node_key) ) return ANT.content_nodes[content_node_key];
                    //else
                    var content_node = {
                        'container': settings.container,
                        'body': settings.body,
                        'location': settings.location,
                        'hash': hash
                    };

                    ANT.content_nodes[content_node_key] = content_node;

                    return content_node;
                },
                quickFixReset: function(hash){
                    //ANT.actions.content_nodes.quickFixReset;

                    //A quick hack to re-make the server call to update the comment count.  
                    //It's silly to make a server call to do this, but we need it to just work for now.
                    var summary = ANT.summaries[hash],
                        container_id = (typeof summary != "undefined") ? summary.id:"";
                    
                    if(container_id){
                        //clear the assetLoader flag which normally prevents it from loading twice.
                        delete ANT.assetLoaders.content_nodes[container_id];
                        ANT.actions.content_nodes.init(hash);
                    }
                    
                },
                init: function(hash, onSuccessCallback){
                    //ANT.actions.content_nodes.init:
                    if (ANT.status.page === true) {

                        // if ( $('.ant-'+hash).hasClass('ant_summary_loaded') ) {
                        //     return;
                        // }

                        // po' man's throttling
                        // if ( typeof ANT.inProgress === "undefined" ) { ANT.inProgress = []; }
                        // if ( $.inArray( hash, ANT.inProgress) != -1 ) {
                        //     return false;
                        // } else {
                        //     ANT.inProgress.push( hash );
                        // }

                        //gets this summary's content_nodes from the server and populates the summary with them.
                        var summary = ANT.summaries[hash],
                            container_id = (typeof summary != "undefined") ? summary.id:"";

                        if(!container_id){
                            //this still happens if container is an unknown container and has no reactions.
                            //It's save to just return for now though.
                            
                            // ANT.safeThrow('container_id is not valid for hash: '+hash);
                        
                            return;
                        }

                        var pageId = ANT.util.getPageProperty('id', hash);

                        //quick fix add pageId to summary becuase we need it in the summary widget content lookup
                        // todo: #summaryContentByPageFix
                        summary.pageId = pageId;

                        var sendData = {
                            "page_id" : pageId,
                            "container_id":container_id,
                            "hash":hash,
                            "cross_page": ( summary.$container.hasAttr('ant-crossPageContent') ) ? true:false
                        };

                        //use an assetLoader that returns a deferred to ensure it gets loaded only once
                        //and callbacks will run on success - or immediately if it has already returned.
                        var assetLoader = ANT.assetLoaders.content_nodes[container_id];

                        if(!assetLoader){
                            assetLoader = $.ajax({
                                url: ANT_baseUrl+"/api/summary/container/content/",
                                type: "get",
                                contentType: "application/json",
                                dataType: "jsonp",
                                data: { json: $.toJSON(sendData) }
                            });

                            ANT.assetLoaders.content_nodes[container_id] = assetLoader;
                        }
                        
                        //todo: also remove redundant callbacks from the summary widget.
                        //we still need the onSuccessCallbacks to run though.
                        assetLoader.then(function(response) {

                            if ( response.status !== "success" ) {
                                return false;
                            }

                            var content_nodes = response.data;
                            //todo: make this generic interactions instead of just tags
                            //summary.interactions.tags =

                            //todo: think about this more later:
                            //make selStates for these nodes and give the nodes a reference to them
                            $.each(content_nodes, function(key, node){

                                var $container = $('[ant-hash="'+hash+'"]');

                                try{
                                    node.selState = $container.selog('save', { 'serialRange': node.location });
                                }
                                catch(err){
                                    node.selState = undefined;
                                }

                            });

                            //throw the content_nodes into the container summary

                            ANT.content_nodes[hash] = content_nodes;
                            summary.content_nodes = content_nodes;

                            if(summary.kind == "text"){
                            }else{
                                //this is weird because there is only one content_node - the img
                                //this whole thing is gross.  Fix our data structure later.

                                summary.top_interactions.coms = {};

                                $.each(content_nodes, function(contentNodeId, contentNodeData){
                                    var comsArr = contentNodeData.top_interactions.coms;

                                    $.each(comsArr, function(idx, com){
                                        summary.top_interactions.coms[ com.tag_id ] = summary.top_interactions.coms[ com.tag_id ] || [];
                                        summary.top_interactions.coms[ com.tag_id ].push(com);
                                    });

                                });
                            }

                            // add a class so we note that the content summary was retrieved
                            $('[ant-hash="'+hash+'"]').attr('ant_summary_loaded', 'true');

                            // fix for ant-item not initted on pageload on a blogroll.  band-aid.  wtf.  ugh.
                            ANT.actions.indicators.update(hash);

                            // remove from po' man's throttling array
                            // po' man's throttling
                            // ANT.inProgress.splice( ANT.inProgress.indexOf( hash ) ,1);
                            // var y = [1, 2, 3]
                            // var removeItem = 2;

                            // if ( typeof ANT.inProgress === "undefined" ) { ANT.inProgress = []; }
                            // ANT.inProgress = $.grep(ANT.inProgress, function(value) {
                            //   return value != hash;
                            // });


                            //finally, run the success callback function
                            if ( onSuccessCallback ) {
                                onSuccessCallback();
                            }

                            //also run any callbacks that get queued up on the summarybar hover
                            if(ANT.contentNodeQueue && ANT.contentNodeQueue[hash] && ANT.contentNodeQueue[hash].length ){
                                $.each(ANT.contentNodeQueue[hash], function(){
                                    var func = ANT.contentNodeQueue[hash].pop();
                                    func(hash);
                                });
                            }
                        });
                    }

                },
                utils: {
                    getMediaDims: function($mediaNode){
                        //ANT.actions.content_nodes.utils.getMediaDims:

                        var h = $mediaNode.height();
                        var w = $mediaNode.width();

                        return ( !h || !w ) ? {} : {
                            height: h,
                            width: w
                        };
                    },
                    makeDictSortedByTag: function(content_nodes){
                        //ANT.actions.content_nodes.utils.makeDictSortedByTag:

                        //make a helper dictionary that inverts our dict of {content_nodes: {tags...} }
                        var invertedDict = {}; //dict will be { tag_id: [ list of content_node_ids }

                        //populate invertedDict - for each tag_node, get all its content_nodes in the summary
                        $.each( content_nodes, function(content_node_id, content_node){
                            $.each(content_node.top_interactions.tags, function(tag_node_id, tag_node){
                                if ( !invertedDict.hasOwnProperty(tag_node_id) ){
                                    invertedDict[tag_node_id] = [];
                                }
                                invertedDict[tag_node_id].push(content_node);
                            });
                        });
                        return invertedDict;
                    },
                    initHiliteStates: function( $tagSpan, content_nodes ){
                        //todo: combine with others - i think this is just being used for indicator details

                        //ANT.actions.content_nodes.utils.initHiliteStates:

                        //add selStates to $tagSpan data.
                        $.each( content_nodes, function(arrIdx, content_node){
                            if( content_node.selState ){
                                $tagSpan.data('selStates').push(content_node.selState);
                            }
                        });

                        //setup hover event to hilite and unhlite
                        // todo: touchHover
                        if(!isTouchBrowser){
                            $tagSpan.hover(
                                function() {

                                    var selStates = $(this).data('selStates');

                                    //quick hack because I don't yet have a good solution for multiple hilites. (overlapping ones cause issues still.)
                                    var lastSelState = selStates.length ? selStates[selStates.length-1] : null;
                                    if (lastSelState){
                                        $().selog('hilite', lastSelState, 'on');
                                    }
                                    /*
                                    $.each( selStates, function(idx, selState){
                                        $().selog('hilite', selState, 'on');
                                    });
                                    */
                                },
                                function() {

                                    var selStates = $(this).data('selStates');
                                    //quick hack because I don't yet have a good solution for multiple hilites. (overlapping ones cause issues still.)
                                    var lastSelState = selStates.length ? selStates[selStates.length-1] : null;
                                    if (lastSelState){
                                        $().selog('hilite', lastSelState, 'off');
                                    }
                                    /*
                                    $.each( selStates, function(idx, selState){
                                        $().selog('hilite', selState, 'off');
                                    });
                                    */
                                }
                            );
                        }
                    }
                }//end ANT.actions.content_nodes.utils
            },
            interactions: {
                //ANT.actions.interactions:
                ajax: function(args, int_type, action_type){
                    //ANT.actions.interactions.ajax:
                    //temp tie-over
                    var hash = args.hash,
                        summary = ANT.summaries[hash],
                        kind = (summary) ? summary.kind:"";

                    if ( !action_type ) action_type = "create";

                    if( !ANT.actions.interactions.hasOwnProperty(int_type) ){
                        return false; //don't continue
                    }

                    // porter cross-page handler
                    var crossPageSendData = {};

                    // take care of pre-ajax stuff, mostly UI stuff
                    ANT.actions.interactions[int_type].preAjax(args, action_type);
                    //get user and only procceed on success of that.

                    ANT.session.getUser( args, function(newArgs){
                        var defaultSendData = ANT.actions.interactions.defaultSendData(newArgs),
                            customSendData = ANT.actions.interactions[int_type].customSendData(newArgs),
                            sendData = $.extend( {}, defaultSendData, customSendData, crossPageSendData );

                        // sendData = $.extend( {}, sendData, args);
                        newArgs.sendData = sendData;

                        //fix hash
                        newArgs.hash = hash;
                        newArgs.sendData.hash = hash;

                        // BAND-AID for re-reacting after a tempuser create
                        if (typeof newArgs.sendData != 'undefined' && typeof newArgs.sendData.sendData != 'undefined') {
                            newArgs.sendData = $.extend( {}, newArgs.sendData, newArgs.sendData.sendData );
                            if ( typeof newArgs.sendData.user != 'undefined' && typeof newArgs.sendData.user.ant_token != 'undefined') {
                                newArgs.sendData.ant_token = newArgs.sendData.user.ant_token;
                            }
                        }
                        //run the send function for the appropriate interaction type
                        //ANT.actions.interactions[int_type].send(args);
                        ANT.actions.interactions.send(newArgs, int_type, action_type);
                    });
                },
                send: function(args, int_type, action_type){
                    // ANT.actions.interactions.send
                    // /api/tag/create
                    // /api/comment/create
                    // hack to cleanup the send data
                    var sendData = $.extend( true, {}, args.sendData);

                    if (sendData.aWindow) delete sendData.aWindow;
                    if (sendData.settings) delete sendData.settings;
                    if (sendData.selState) delete sendData.selState;
                    if (sendData.content_node ) delete sendData.content_node;
                    if (sendData.response ) delete sendData.response;           // if there's a response, it's bc we're passing sendData from a past failed call.  remove the response.
                    if (sendData.content_node_data && sendData.content_node_data.selState ) delete sendData.content_node_data.selState;
                    if (sendData.content_node_data && sendData.content_node_data.counts ) delete sendData.content_node_data.counts;
                    if (sendData.content_node_data && sendData.content_node_data.top_interactions ) delete sendData.content_node_data.top_interactions;
                    if (sendData.content_node_data && sendData.content_node_data.$container) delete sendData.content_node_data.$container; //this was happening for delete calls.
                    if (sendData.content_node_data && sendData.content_node_data.$indicator) delete sendData.content_node_data.$indicator; //this was happening for delete calls.
                    if (sendData.content_node_data && sendData.content_node_data.$indicator_details) delete sendData.content_node_data.$indicator_details; //this was happening for delete calls.
                    if (sendData.content_node_data && sendData.content_node_data.$aWindow_readmode) delete sendData.content_node_data.$aWindow_readmode; //this was happening for delete calls.
                    if (sendData.node) delete sendData.node;
                    if (sendData.uiMode) delete sendData.uiMode;
                    if (sendData.sendData) delete sendData.sendData; //this was happening for delete calls.

// TODO force forcing
if ( ANT.summaries[sendData.hash] ) sendData.container_kind = ANT.summaries[sendData.hash].kind;
// sendData.container_kind = sendData.hash;
if (sendData.content_node_data && sendData.content_node_data.container ) delete sendData.content_node_data.container;
                    // [porter] I changed all references to "tag" to be "react" so the widget code is easier to understand
                    // but our URLs expect /tag/, so this rewrite that.
                    var int_type_for_url = (int_type=="react") ? "tag":int_type;

// more stupid forcing thanks to disparate attribtue names
if ( typeof sendData.tag != "undefined" ) {
    sendData.tag.body = ( sendData.tag.body ) ? sendData.tag.body:sendData.tag.tag_body;
}

// TODO forcing.  react-to-page code seems to need a hash, and stores it.  IE is not hashing page correctly.
// and not sure we want that, anyway -- since the page hash would change often.  so, forcing the hash to be "page"
// for all page-level reactions.  the PAGE_ID is the unique part of the call, anyway.
// also: this is stupid.
if ( sendData.kind=="page" ) {
 sendData.hash = args.hash = "page";
 sendData.container_kind = "text";
 sendData.page_id = sendData.page_id || ANT.util.getPageProperty('id', "page");
 delete sendData.content_node_data.hash; //this was happening for delete calls.
}
                    //todo: consider making a generic url router
                    var url = ANT_baseUrl+"/api/" +int_type_for_url+ "/"+action_type+"/";
                    var hitMax = ANT.session.checkForMaxInteractions(args);

                    if (!hitMax) {
                        // send the data!
                        $.ajax({
                            url: url,
                            type: "get",
                            contentType: "application/json",
                            dataType: "jsonp",
                            data: { json: $.toJSON(sendData) },
                            success: function(response) {
                                args.response = response;

                                if (typeof args.sendData != 'undefined' && typeof args.sendData.sendData != 'undefined') {
                                    args.content_node_data = args.sendData.sendData.content_node_data;
                                }

                                //this will be here for new containers only
                                if( response.data && response.data.container ){
                                    args.container_id = response.data.container.id;
                                    var hash = args.hash = response.data.container.hash;
                                }

                                if ( response.data && response.data.num_interactions ) {
                                    ANT.user.num_interactions = response.data.num_interactions;
                                }

                                if ( response.status == "success" ) {

                                    if(args.response.data.deleted_interaction){
                                        args.deleted_interaction = args.response.data.deleted_interaction;
                                    }

                                    args.scenario = ( args.response.data.existing ) ? "reactionExists": ( args.response.data.deleted_interaction ) ? "tagDeleted":"reactionSuccess";
                                    if ( typeof args.tag.id == "undefined" ) {
                                        args.tag.id = response.data.interaction.interaction_node.id;
                                    }

                                    ANT.actions.interactions[int_type].onSuccess[action_type](args);
                                }else{
                                    if ( int_type == "react" ) {
                                        if ( response.message == "sign in required for organic reactions" ) {
                                            ANT.session.showLoginPanel( args );
                                        }
                                        else {
                                            if (response.message.indexOf( "Temporary user interaction limit reached" ) != -1 ) {
                                                // ANT.events.track( 'temp_limit_hit_r' );
                                                ANT.session.showLoginPanel( args );
                                            } else {
                                                ANT.actions.interactions[int_type].onFail(args);
                                            }
                                        }
                                    } else {
                                        if (response.message.indexOf( "Temporary user interaction limit reached" ) != -1 ) {
                                            // ANT.events.track( 'temp_limit_hit_r' );
                                            ANT.session.showLoginPanel( args );
                                        } 
                                        if ( response.message == "existing interaction" ) {
                                            //todo: I think we should use adapt the showTempUserMsg function to show a message "you have already said this" or something.
                                            //showTempUserMsg should be adapted to be aWindowUserMessage:{show:..., hide:...}
                                                //with a message param.
                                                //and a close 'x' button.
                                                args.msgType = "existingInteraction";
                                                ANT.session.aWindowUserMessage.show( args );
                                        }
                                        else {
                                            // if it failed, see if we can fix it, and if so, try this function one more time
                                            ANT.session.handleGetUserFail( args, function() {
                                                ANT.actions.interactions.ajax( args, int_type, 'create' );
                                            });
                                        }
                                    }
                                }
                                // if ( typeof ANT.inProgress === "undefined" ) { ANT.inProgress = []; }
                                // ANT.inProgress = $.grep(ANT.inProgress, function(value) {
                                //   return value != hash;
                                // });
                                ANT.util.userLoginState();
                            }
                        });
                    } else {
                        ANT.session.showLoginPanel( args, function() { ANT.actions.interactions.ajax( args, int_type, 'create' ); } );
                    }
                },
                defaultSendData: function(args){
                    //ANT.actions.interactions.defaultSendData:
                    args.user_id = ANT.user.user_id;
                    args.ant_token = ANT.user.ant_token;
                    args.group_id = ANT.group.id;
                    args.page_id = (args.page_id) ? args.page_id : ANT.util.getPageProperty('id', args.hash);

                    if ( ANT.user.user_id === null || isNaN(ANT.user.user_id)) {
                        delete ANT.user.user_id;
                        delete args.user_id;
                    }

                    return args;

                },
                comment: {
                    preAjax: function(args){
                        var $aWindow = args.aWindow;
                        if ( $aWindow ) $aWindow.find('div.ant_loader').css('visibility','visible');
                    },
                    customSendData: function(args){
                        //ANT.actions.interactions.comment.customSendData:
                    },
                    onSuccess: {
                        //ANT.actions.interactions.comment.onSuccess:
                        create: function(args){
                            //ANT.actions.interactions.comment.onSuccess.create:
                            var $aWindow = args.aWindow,
                                hash = args.hash,
                                response = args.response,
                                tag = args.tag;

                            //clear loader
                            if ( $aWindow ) {
                                $aWindow.find('div.ant_loader').css('visibility','hidden');
                                ANT.util.stayInWindow( $aWindow, true );

                                //messy fixes for success responses in crossPageHash containers.
                                ANT.actions.content_nodes.quickFixReset(hash);

                                var isInlineAWindow = ($aWindow.hasClass('ant_inline') || $aWindow.find('.ant_inline').length);
                                
                                var $responseMsg = $('<span class="success_msg" >'+ANT.t('thanks_for_comment')+' </span>');
                                var $doneButton = $('<a class="ant_doneButton" href="#">'+ANT.t('close')+'</a>')
                                    .click(function(e){
                                        e.preventDefault();

                                        //there's a bug, just close the aWindow for now. 
                                        // ANT.aWindow.close( $aWindow );
                                        ANT.aWindow.safeClose( $aWindow );
                                        // $aWindow.find('.ant_back').eq(0).click();
                                    });

                                var isPostTagComment = $('.ant_subheader').length;
                                if(isPostTagComment){

                                    $('.ant_nextActions').remove();
                                    $aWindow.find('.ant_subheader')
                                        .empty().append($responseMsg).append($doneButton);

                                }else{
                                    $aWindow.find('.ant_commentBox')
                                        .empty().append($responseMsg).append($doneButton);
                                }
                                        
                                

                            }

                            var interaction = response.data.interaction,
                                
                                content_node = response.data.content_node ? 
                                    response.data.content_node :
                                    response.content_node_data ? 
                                        response.content_node_data : 
                                        args.content_node_data,

                                content_id = (content_node && content_node.id) ? content_node.id:"",
                                num_interactions = response.data.num_interactions;

                            //ugg - hack for existing comment on a non-text node.
                            var isText = content_node.kind == 'text' || content_node.kind == "txt";
                            var isExisting = response.data.existing;
                            if (!isText && isExisting) {
                                var content_nodes = ANT.content_nodes[hash];
                                $.each(content_nodes, function(id, node){
                                    //there should be only one, but sometimes there is an undefined entry - ignore that.
                                    //seriously, the id is the string "undefined" - ug.  Find the root of that and fix.
                                    if(id && id != "undefined"){
                                        //override the content_node
                                        content_node = node;
                                        content_id = content_node.id;
                                    }
                                });
                            }

                            //todo: examine resize
                            // ANT.aWindow.updateSizes( $aWindow );


                            // $aWindow.find('div.ant_commentBox').find('div.ant_tagFeedback, div.ant_comment').hide();

                            //todo: consider adding these fields to the summary
                            // update the comments for this hash
                            // var newComment = {
                            //     body: comment,
                            //     content_id: ,
                            //     id: response.data.interaction.id, // interaction id
                            //     social_user: ,
                            //     tag_id: ,
                            //     user:
                            // }
                            //do updates

                            //todo: unify this with the rest of the interactions
                            var tagId = parseInt(args.tag.id, 10);

                            var intHelper = {
                                delta: 1,
                                num_interactions: num_interactions,
                                id: interaction.id,
                                body: interaction.interaction_node.body,
                                content_node: content_node,
                                content_id: content_id,
                                //doesn't seem like we're using these
                                    // parent_id: args.parent_id,
                                    // parent_interaction_node: args.tag,
                                tag_id: tagId,
                                user: args.user,
                                social_user: args.social_user,
                                parent_id: null, //todo: I don't think we're using this
                                parent_interaction_node: args.tag,

                            };

                            var diff = {
                                coms: {

                                }
                            };

                            diff.coms[ tagId ] = intHelper;

                            //for now, just pull all the content_nodes down and
                            //(this will automatically) update the summary object
                            //run the rest of our comment update on the callback
                            ANT.actions.content_nodes.init(hash, function(){
                                ANT.actions.summaries.update(hash, diff);
                            });

                            //not using this
                            // var usrMsgArgs = {
                            //     msgType: "interactionSuccess",
                            //     interactionInfo: {
                            //         type: 'comment'
                            //     },
                            //     aWindow:$aWindow
                            // };

                            ANT.events.trackEventToCloud({
                                event_type: "c",
                                event_value: interaction.interaction_node.body,
                                container_hash: hash,
                                container_kind: content_node.kind,
                                page_id: args.page_id,
                                reaction_body: args.tag.tag_body
                            });

                            ANT.events.emit('antenna.comment', interaction.interaction_node.body, { 'reaction':tag.tag_body, 'hash':hash, 'kind':content_node.kind });

                        },
                        remove: function(args){
                            //ANT.actions.interactions.comment.onSuccess.remove:

                            //clear loader
                            var $aWindow = args.aWindow;
                            if ( $aWindow ) $aWindow.find('div.ant_loader').css('visibility','hidden');
                        }

                    },
                    onFail: function(args){
                        //clear loader
                        var $aWindow = args.aWindow;
                        if ( $aWindow ) $aWindow.find('div.ant_loader').css('visibility','hidden');
                    }
                },
                share: {
                    preAjax: function(){
                        var $aWindow = args.aWindow;
                        if ( $aWindow ) $aWindow.find('div.ant_loader').css('visibility','visible');
                    },
                    customSendData: function(){
                        return {};
                    },
                    onSuccess: function(args){
                        //clear loader
                        var $aWindow = args.aWindow;
                        if ( $aWindow ) $aWindow.find('div.ant_loader').css('visibility','hidden');
                    },
                    onFail: function(args){
                        //clear loader
                        var $aWindow = args.aWindow;
                        if ( $aWindow ) $aWindow.find('div.ant_loader').css('visibility','hidden');
                    }
                },
                // breaks the interaction convention:
                // boardadd: {
                //     preAjax: function(){
                //         var $aWindow = args.aWindow;
                //         if ( $aWindow ) $aWindow.find('div.ant_loader').css('visibility','visible');
                //     },
                //     customSendData: function(){
                //         return {};
                //     },
                //     onSuccess: {
                //         //ANT.actions.interactions.react.onSuccess:
                //         create: function(args){
                //             //clear loader
                            
                //             //carefull with this.. $('div.ant_tag_details.ant_reacted') without the ant_live_hover was returning 2 nodes. shore this up later.
                //             var $aWindow = (args.aWindow) ? args.aWindow : $('div.ant_tag_details.ant_reacted.ant_live_hover');
                //             $aWindow.find('div.ant_loader').css('visibility','hidden');

                //             var safe_board_name = args.board_name.replace(/\s/g,"_"),
                //                 newArgs = { board_id:args.board_id, int_id:args.int_id },
                //                 $success = $('<div class="ant_success">Success!  See <a target="_blank" href="'+ANT_baseUrl+'/board/'+args.board_id+'/'+safe_board_name+'" class="ant_seeit_link">your board.</a> <a href="javascript:void(0);" class="ant_seeit_link ant_undo">Undo?</a></div>');
                            
                //             $aWindow.find('.ant_select_user_board').append( $success ).find('select').hide();

                //             $success.find('a.ant_undo').click( function() {
                                
                //                 args.aWindow = $aWindow;
                //                 // panelEvent
                //                 ANT.actions.interactions.ajax( args, 'boarddelete', 'create' ); // odd i know.  the board calls break convention.
                //             });
                //         }
                //     }
                // },
                // // breaks the interaction convention:
                // boarddelete: {
                //     preAjax: function(){
                //         var $aWindow = args.aWindow;
                //         if ( $aWindow ) $aWindow.find('div.ant_loader').css('visibility','visible');
                //     },
                //     customSendData: function(){
                //         return {};
                //     },
                //     onSuccess: {
                //         //ANT.actions.interactions.react.onSuccess:
                //         create: function(args){
                //             //clear loader
                            
                //             var $aWindow = args.aWindow;
                //             if ( $aWindow ) $aWindow.find('div.ant_loader').css('visibility','hidden');

                //         }
                //     }
                // },
                react: {
                    preAjax: function(args, action_type){
                        var $aWindow = args.aWindow;
                        if ( $aWindow ) $aWindow.find('div.ant_loader').css('visibility','visible');
                    },
                    customSendData: function(args){
                        ////ANT.actions.interactions.react.customSendData:
                        //temp tie-over

                        var hash = args.hash,
                            summary = ANT.summaries[hash],
                            $container = $('[ant-hash="'+hash+'"]'),
                            kind,
                            tag,
                            sendData;

                        var isPage = (hash == "page") || (args.kind && args.kind == "page");
                        if (isPage) {
                            kind = "page";
                            tag = args.tag;

                            content_node_data = {
                                'container': hash,
                                'body': "",
                                'kind':kind,
                                'hash':hash,
                                'item_type':'page'
                            };

                            sendData = {
                                //interaction level attrs
                                "tag" : tag,
                                "node": null,
                                "content_node_data":content_node_data,
                                "hash": hash,
                                //page level attrs
                                "user_id" : ANT.user.user_id,
                                "ant_token" : ANT.user.ant_token,
                                "group_id" : ANT.group.id,
                                "page_id" : (args.page_id) ? args.page_id : ANT.util.getPageProperty('id', hash)
                            };
                        } else  {

                            kind = summary.kind;

                            var $container = $('[ant-hash="'+hash+'"]');

                            var aWindow = args.aWindow,
                                tag_li = args.tag;

                            tag = ( typeof args.tag.data == "function" ) ? args.tag.data('tag'):args.tag;

                            var content_node_data = {};
                            //If readmode, we will have a content_node.  If not, use content_node_data, and build a new content_node on success.
                            var content_node = args.content_node || null;

                            if ( kind == 'custom' ){
                                content_node_data = {
                                    'container': aWindow.data('container'),
                                    'body': $container.attr('ant-src'),
                                    'kind':'media',
                                    'location': $container.get(0).nodeName.toLowerCase(), // trying to store the tagName, so we can convert to a media type later...???
                                    'hash':hash,
                                    'item_type': ($container.hasAttr('ant-item-type')) ? $container.attr('ant-item-type') : ''
                                };

                            } else if(kind == 'img' || kind == 'media' || kind == 'med'){
                                // a bit inconsistent with how we get the body in hashNodes()...
                                var hashBody = (typeof $container[0].src != 'undefined') ? $container[0].src : $container.data('body');


                                // // clean the image src in case it's a CDN w/ rotating subdomains.
                                // // regex from http://stackoverflow.com/questions/6449340/how-to-get-top-level-domain-base-domain-from-the-url-in-javascript
                                // var HOSTDOMAIN = /[-\w]+\.(?:[-\w]+\.xn--[-\w]+|[-\w]{3,}|[-\w]+\.[-\w]{2})$/i;
                                // var srcArray = hashBody.split('/'),
                                //     srcProtocol = srcArray[0];

                                // srcArray.splice(0,2);

                                // var domainWithPort = srcArray.shift();
                                // var domain = domainWithPort.split(':')[0]; // get domain, strip port
                     
                                // var filename = srcArray.join('/');

                                // // test examples:
                                // // var match = HOSTDOMAIN.exec('http://media1.ab.cd.on-the-telly.bbc.co.uk/'); // fails: trailing slash
                                // // var match = HOSTDOMAIN.exec('http://media1.ab.cd.on-the-telly.bbc.co.uk'); // success
                                // // var match = HOSTDOMAIN.exec('media1.ab.cd.on-the-telly.bbc.co.uk'); // success
                                // var match = HOSTDOMAIN.exec( domain );
                                // if (match == null) {
                                //     return;
                                // } else {
                                //     hashBody = match[0] + '/' + filename;
                                // }

                                if ( ANT.group.media_url_ignore_query && hashBody.indexOf('?') ){
                                    hashBody = hashBody.split('?')[0];
                                }

                                content_node_data = {
                                    'container': aWindow.data('container'),
                                    'body': hashBody,
                                    'kind':kind,
                                    // 'location':srcProtocol + '//' + match.input.substr(0,match.index),  // http://whatever-the-subdomain-is.
                                    'hash':hash,
                                    'item_type': ($container.hasAttr('ant-item-type')) ? $container.attr('ant-item-type') : ''
                                };

                                //add dims
                                var mediaDims = ANT.actions.content_nodes.utils.getMediaDims($container)
                                $.extend(content_node_data, mediaDims);

                            }else{
                                //is text
                                //todo: fix this temp hackery
                                if(content_node){
                                    content_node_data = {
                                        'container': aWindow.data('container'),
                                        'body': content_node.body,
                                        'location': content_node.location,
                                        'kind':kind,
                                        'id':content_node.id,
                                        'item_type': ($container.hasAttr('ant-item-type')) ? $container.attr('ant-item-type') : ''
                                    };
                                }else{

                                    // is it a ant-item?  if so, let's force the content_node info, if already known
                                    // UGHUGHUGHUGHUGHUGHUGHUGHUGHUGH
                                    // i don't foxtrot think this is a doing a fucking thing.  
                                    if ( $container.hasAttr('ant-item') && typeof ANT.summaries[hash].content_nodes != 'undefined' && ANT.summaries[hash].content_nodes.length ) {
                                        $.each( ANT.summaries[hash].content_nodes, function(content_node_id, node) {
                                            // grab the first one that is not 'undefined'
                                            if ( content_node_id != 'undefined' ) {
                                                content_node = node;
                                            }
                                        });
                                        content_node_data = {
                                            'container': aWindow.data('container'),
                                            'body': content_node.body,
                                            'location': content_node.location,
                                            'kind':kind,
                                            'id':content_node.id,
                                            'item_type': $container.attr('ant-item-type')
                                        };
                                    } else {
                                        var content_node_id = aWindow.find('div.ant_tag_'+tag.id).data('content_node_id'),
                                            selState = ( content_node_id ) ? summary.content_nodes[ content_node_id ].selState : aWindow.data('selState');
                                            if(!selState){
                                                ANT.safeThrow("selState not found:  I cannot figure out why this happens every once in a while");
                                                return;
                                            }
                                        content_node_data = {
                                            'container': aWindow.data('container'),
                                            'body': selState.text,
                                            'location': selState.serialRange,
                                            'kind': kind,
                                            'item_type': ($container.hasAttr('ant-item-type')) ? $container.attr('ant-item-type') : ''
                                        };
                                    }

                                }

                                // now correct this 0/0:0,0/2:6 bug
                                // unsure why this occurs, i have not replicated it consistently
                                // but it causes the Q&A breakage where the same content appears different to the back-end, due to location being
                                // something like 0/0:0,0/2:6 rather than 0:0,2:6
                                if ( content_node_data.location.indexOf('/') != -1 ) {
                                    var newLocationArray = content_node_data.location.split(','),
                                        newLocation = '';

                                    newLocation = newLocationArray[0].split('/')[1] + ',' + newLocationArray[1].split('/')[1];
                                    content_node_data.location = newLocation;
                                }
                            }

                            sendData = {
                                //interaction level attrs
                                "tag" : tag,
                                "node": content_node,                        //null if writemode
                                "content_node_data":content_node_data,
                                "hash": content_node_data.container,
                                //page level attrs
                                "user_id" : ANT.user.user_id,
                                "ant_token" : ANT.user.ant_token,
                                "group_id" : ANT.group.id,
                                "page_id" : ANT.util.getPageProperty('id', hash),
                                "int_id" : args.int_id
                            };
                        }

                        return sendData;

                    },
                    onSuccess: {
                        //ANT.actions.interactions.react.onSuccess:
                        create: function(args){
                            //ANT.actions.interactions.react.onSuccess.create:
                            //todo: clean up these args.

                            // init vars
                            var $aWindow = args.aWindow,
                                // $tag_table = $aWindow.find('table.ant_tags'),
                                uiMode = $aWindow.data('mode') || 'writeMode',
                                response = args.response,
                                interaction = response.interaction,
                                interaction_node = response.data.interaction.interaction_node,
                                container = response.data.container,
                                sendData = args.sendData,
                                content_node = sendData.content_node_data,
                                //todo: verify
                                // content_node = response.data.content_node,

                                tag = ( typeof args.tag.data == "function" ) ? args.tag.data('tag'):args.tag,
                                int_id = response.data.interaction.id;

                            var reaction = (tag.body) ? tag.body:tag.tag_body;

                            ANT.events.trackEventToCloud({
                                event_type: 're',
                                event_value: reaction,
                                reaction_body: reaction,
                                container_hash: args.hash,
                                container_kind: args.kind,
                                content_location: content_node.location,
                                content_id: (response.data.content_node) ? response.data.content_node.id:null,
                                page_id: args.page_id
                            });

                            ANT.events.emit('antenna.reaction', reaction, { 'hash':args.hash, 'kind':args.kind, 'ant-item-name':$('[ant-hash="'+args.hash+'"]').attr('ant-item') });

                            $('#ant_loginPanel').remove();

                            //clear loader
                            if ( $aWindow ) $aWindow.find('div.ant_loader').css('visibility','hidden');

                            // remove summary loaded since we might need to call it again....
                            $('[ant-hash="'+hash+'"]').removeAttr('ant_summary_loaded');

                            //todo: we should always only have one tooltip - code this up in one place.
                            //quick fix for tooltip that is still hanging out after custom reaction
                            $('.ant_twtooltip').remove();

                            if (args.kind && args.kind == "page") {
                                // ANT.actions.viewReactionSuccess( args );

                                // // either we have a hash, or we don't, and so we hope there is only one div.ant-summary.  IE sucks.
                                // var $summary_box = $aWindow.find('.ant_tags_list');
                                // var $pageTagResponse = $('<div class="ant_info"></div>');
                                
                                // var $shareIcons = _makeShareIcons(args);

                                var existing = args.response.data.existing;

                                if(!existing){

                                //     var $ant_reactionMessage = $('<div class="ant_reactSuccess ant_reactionMessage"></div>');
                                //     var $feedbackMsg = $(
                                //         '<div class="feedbackMsg">'+
                                //             '<div class="ant_label_icon"></div>'+
                                //             '<em>Thanks!  You reacted <strong style="color:#008be4;font-style:italic !important;">'+args.tag.body+'</strong>.</em>'+
                                //             '<span class="pipe"> | </span>'+
                                //             // '<span><a target="_blank" href="'+ANT_baseUrl+'/interaction/'+args.response.data.interaction.id+'" class="ant_seeit_link">See it.</a></span>'+
                                //             '<span><a href="javascript:void(0);" class="ant_undo_link">Undo?</a></span>'+
                                //         '</div>'
                                //     );
                                //     $feedbackMsg.find('a.ant_undo_link').on('click.ant', {args:args}, function(event){
                                //         // panelEvent - undo2
                                //         var args = event.data.args;
                                //         args.aWindow = $(this).closest('.ant_tag_details');
                                //         _undoPageReaction(args);
                                //     });

                                //     $pageTagResponse.append($feedbackMsg);
                                //     $pageTagResponse.append($shareIcons);
                                    
                                //     $pageTagResponse.append('<div class="ant_tipReactToOtherStuff"><strong>Tip:</strong> You can <strong style="color:#008be4;">react to anything on the page</strong>. <ins>Select some text, or roll your mouse over any image or video, and look for this icon: <img src="'+ANT_staticUrl+'widget/images/blank.png" class="no-ant" style="background:url('+ANT_staticUrl+'widget/images/ant_icons.png) 0px 0px no-repeat;margin:0 0 -5px 0;" /></ins></div>' );
                                //     $summary_box.addClass('ant_reacted').html( $pageTagResponse );
                                    

                                    _doPageUpdates(args);
                                    
                                // }else{

                                //     var $ant_reactionMessage = $('<div class="ant_reactionMessage"></div>');
                                //     var $feedbackMsg = $(
                                //         '<div class="feedbackMsg">'+
                                //             '<em><strong>You have already given that reaction.</em></strong>'+
                                //             '<span class="pipe"> | </span>'+
                                //             // '<span><a target="_blank" href="'+ANT_baseUrl+'/interaction/'+args.response.data.interaction.id+'" class="ant_seeit_link">See it.</a></span>'+
                                //             '<span><a href="javascript:void(0);" class="ant_undo_link">Undo?</a></span>'+
                                //         '</div>'
                                //     );
                                //     $feedbackMsg.find('a.ant_undo_link').on('click.ant', {args:args}, function(event){
                                        
                                //         // panelEvent - undo3

                                //         var args = event.data.args;
                                //         args.aWindow = $(this).closest('.ant_tag_details');
                                //         _undoPageReaction(args);
                                //     });

                                //     $pageTagResponse.append($feedbackMsg);

                                //     $pageTagResponse.append($shareIcons);
                                //     $summary_box.addClass('ant_reacted').html( $pageTagResponse );
                                }
                                
                                // ANT.aWindow.updateFooter( $aWindow, '' );


                                ANT.actions.viewReactionSuccess( args );

                            } else {
                                // not a page-level reaction

                                //temp tie-over
                                var hash = args.hash,
                                    summary = ANT.summaries[hash],
                                    kind = summary.kind;


                                //more freaking tie-overs
                                args.settings = args.sendData.content_node_data;

                                //todo: untangle these argument translations.
                                var content_node_data = sendData.content_node_data;

                                //temp tie over
                                content_node_data.hash = content_node_data.container;
                                content_node_data.kind = sendData.kind;

                                // attempting to fix the summary widget-not-updating, and it seems to be b/c content_nodes aren't updated
                                // update page container info, to fix the 'summary widget not updating' problem.  abstract this?
                                // ANT.page[ PAGE ID ].containers

                                //this is weird because there is only one content_node - the img
                                //this whole thing is gross.  Fix our data structure later.

                                // stolen from the success callback in ANT.actions.content_nodes.init
                                // but wanted to not abstract that b/c this data structure is not the same.  natch.

                                if (typeof summary.content_nodes == "undefined") {
                                    summary.content_nodes = {};
                                }

                                //quick fixes for the container id too.
                                //If the container came down eariler as an unknown container,
                                //it will be saved but not have an id yet.
                                var savedContainer = ANT.containers[hash];
                                if(savedContainer && container && container.id){
                                    savedContainer.id = container.id;
                                }

                                // this content_node summary does not exist
                                if ( typeof summary.content_nodes[ content_node.id ] == "undefined" ) {
                                    summary.content_nodes[ content_node.id ] = {
                                        "body":content_node.body,
                                        "counts":{
                                            "coms": 0, 
                                            "tags": 1, 
                                            "interactions": 1
                                        },
                                        "id":content_node.id,
                                        "kind":content_node.kind, // use this, NOT send_data version.  we want "txt", not "text".  sigh.
                                        "location":sendData.content_node_data.location,
                                        "selState":false,
                                        "top_interactions":{
                                            "coms": {}, 
                                            "tags": {}
                                        }
                                    };
                                } else {
                                    if (args.scenario != "reactionExists" ) {
                                        // just update the content_node summary
                                        summary.content_nodes[ content_node.id ].counts.tags++;
                                        summary.content_nodes[ content_node.id ].counts.interactions++;
                                    }
                                }
                                
                                if (typeof summary.content_nodes[ content_node.id ].top_interactions.tags[ tag.id ] == "undefined" ) {
                                    summary.content_nodes[ content_node.id ].top_interactions.tags[ tag.id ] = {
                                        "count":1,
                                        "body":tag.body,
                                        parent_id:null
                                    }
                                } else {
                                    if (args.scenario != "reactionExists" ) {
                                        summary.content_nodes[ content_node.id ].top_interactions.tags[ tag.id ].count++;
                                    }
                                }




                                //reset this var for now
                                content_node_data = args.content_node || ANT.actions.content_nodes.make(content_node_data);

                                //if the summary doesn't have an id, set it
                                summary.id = summary.id || args.container_id;
                                //do updates
                                var intNodeHelper = {
                                    id: interaction_node.id,
                                    parent_id: null,
                                    parent_interaction_node: tag,
                                    content_id: null, //todo add later
                                    body: interaction_node.body,
                                    delta: 1,
                                    user: args.user,
                                    social_user: args.social_user
                                };

                                var diff = {
                                    tags: {}
                                };
                                diff.tags[ intNodeHelper.id ] = intNodeHelper;

                                if ( args.scenario != "reactionExists" ) {
                                    ANT.actions.summaries.update(hash, diff);
                                }

                                // update the aWindow to reflect success
                                ANT.actions.viewReactionSuccess( args );

                                if ( ANT.actions.indicators.showOnlyInitial === true ) {
                                    ANT.actions.indicators.showOnlyInitial = false;
                                    ANT.actions.summaries.showLessPopularIndicators();
                                }

                            }

                            function _makePageReactSuccess(args){
                            }

                            function _makePageReactAlreadyGiven(args){
                            }
                            
                            function _undoPageReaction(args){
                                var newArgs = {
                                    hash: args.hash,
                                    kind: 'page',
                                    //needs the page_id for now because getByPageId doesnt work for the summary widget
                                    page_id:args.page_id,
                                    int_id: args.response.data.interaction.id,
                                    tag: args.tag,
                                    aWindow: args.aWindow
                                };
                                ANT.actions.interactions.ajax( newArgs, 'react', 'remove' );
                            }

                            function _doPageUpdates(args){
                                var intNodeHelper = {
                                    kind: "page",
                                    page_id: args.page_id,
                                    id: args.response.data.interaction.interaction_node.id,
                                    parent_id: null,
                                    parent_interaction_node: null,
                                    content_id: null, //todo add later
                                    body: args.response.data.interaction.interaction_node.body,
                                    delta: 1,
                                    user: args.user,
                                    social_user: args.social_user
                                };

                                var diff = {
                                    tags: {}
                                };
                                diff.tags[ intNodeHelper.id ] = intNodeHelper;

                                // if ( args.scenario != "reactionExists" ) {
                                    //true for isPage
                                    ANT.actions.summaries.update(args.hash, diff, true, args.page_id);
                                // }
                            }


                            function _makeShareIcons(args){
                                // embed icons/links for diff SNS

                                var socialNetworks = ["facebook","twitter", "tumblr"]; //,"tumblr","linkedin"];
                                var shareHash = args.hash;
                                var $shareWrapper = $('<div class="shareWrapper" ></div>');
                                
                                $shareWrapper.append('<strong class="ant_share_it">Share It:</strong>');

                                $.each(socialNetworks, function(idx, val){
                                    $shareWrapper.append('<a href="http://' +val+ '.com" class="ant_share_link"><img class="no-ant" src="'+ANT_staticUrl+'widget/images/social-icons-loose/social-icon-' +val+ '.png" /></a>');
                                    $shareWrapper.find('a.ant_share_link:last').click( function() {
                                        
                                        ANT.events.trackEventToCloud({
                                            // action: "share_open_attempt",
                                            // opt_label: "which: "+val+", kind: "+args.kind+", page: "+args.page_id+", tag: "+args.tag.body,
                                            event_type: "sh",
                                            event_value: val,
                                            container_kind: args.kind,
                                            page_id: args.page_id
                                        });

                                        ANT.shareWindow = window.open(ANT_staticUrl+'share.html', 'ant_share','menubar=1,resizable=1,width=626,height=436');

                                        var title = $('meta[property="og:title"]').attr('content') ?
                                            $('meta[property="og:title"]').attr('content') :
                                                $('title').text() ?
                                                $('title').text() : "";

                                        ANT.actions.share_getLink({ hash:shareHash, kind:args.kind, sns:val, aWindow:{}, tag:args.tag, content_node:{content:title,kind:"page"} }); // ugh, lots of weird data nesting
                                        return false;
                                    });
                                });
                                return $shareWrapper;
                            }
                        },
                        remove: function(args){
                            //ANT.actions.interactions.react.onSuccess.remove:
                            var sendData = args.sendData;
                            var interaction_node = args.response.data.deleted_interaction.interaction_node;
                            var $aWindow = args.aWindow,
                                tag = args.tag,
                                int_id = args.int_id;

                            //clear loader
                            if ( $aWindow ) $aWindow.find('div.ant_loader').css('visibility','hidden');

                            //do updates
                            var hash = sendData.hash;
                            var intNodeHelper = {
                                id: interaction_node.id,
                                parent_id: null,
                                content_id: null, //todo add later
                                body: interaction_node.body,
                                delta: -1,
                                user: args.user,
                                social_user: args.social_user
                            };

                            var diff = {
                                tags: {}
                            };
                            diff.tags[ intNodeHelper.id ] = intNodeHelper;

                            var isPage = (args.kind == 'page' || hash=="page");
                            if(isPage){
                                //a bit hacky
                                ANT.actions.summaries.update(hash, diff, isPage, args.page_id);
                            }else{
                                ANT.actions.summaries.update(hash, diff);
                            }
                            
                            var usrMsgArgs = {
                                msgType: "interactionSuccess",
                                interactionInfo: {
                                    type: 'tag',
                                    body: interaction_node.body,
                                    remove: true
                                },
                                aWindow:$aWindow
                            };
                            //queued up to be released in the sharestart function after the animation finishes
                            // NOT TRUE ANYMORE?
                            $aWindow.queue('userMessage', function(){
                                ANT.session.aWindowUserMessage.show( usrMsgArgs );
                            });
                            
                            if(isPage){
                                ANT.aWindow.updatePageTagMessage( args, 'tagDeleted' );
                            }else{
                                ANT.aWindow.updateTagMessage( {aWindow:$aWindow, tag:args.tag, scenario:"tagDeleted", args:args} );
                            }

                        }
                    },
                    onFail: function(args){
                        //ANT.actions.interactions.react.onFail:
                        //todo: we prob want to move most of this to a general onFail for all interactions.
                        // So this function would look like: doSpecificOnFailStuff....; ANT.actions.interactions.genericOnFail();

                        var theseArgs = args;

                        //clear loader
                        var $aWindow = theseArgs.aWindow,
                            response = theseArgs.response;
                        if ( $aWindow ) $aWindow.find('div.ant_loader').css('visibility','hidden');

                        if (response.message.indexOf( "Temporary user interaction limit reached" ) != -1 ) {
                            ANT.session.receiveMessage( theseArgs, function() { ANT.actions.interactions.ajax( theseArgs, 'react', 'create' ); } );
                            ANT.session.showLoginPanel( theseArgs );
                        } else if ( response.message == "existing interaction" ) {
                            //todo: I think we should use adapt the showTempUserMsg function to show a message "you have already said this" or something.
                            //showTempUserMsg should be adapted to be aWindowUserMessage:{show:..., hide:...}
                                //with a message param.
                                //and a close 'x' button.
                                theseArgs.msgType = "existingInteraction";
                                ANT.session.aWindowUserMessage.show( theseArgs );
                        } else if ( response.message.indexOf("blocked this tag") != -1 ) {
                            alert( ANT.t('bad_language_warning') );
                        } else {
                            // if it failed, see if we can fix it, and if so, try this function one more time
                            ANT.session.handleGetUserFail( theseArgs, function() {
                                ANT.actions.interactions.ajax( theseArgs, 'react', 'create' );
                            });
                        }
                    }
                }
                //end ANT.actions.interactions
            },
            indicators: {
                showOnlyInitial:true,
                show: function(hashes){
                    //ANT.actions.indicators.show:
                    //todo: boolDontFade is a quick fix to not fade in indicators
                    //hashes should be an array or a single hash string
                    var $indicators = this.fetch(hashes);

                    if ( ANT.actions.indicators.showOnlyInitial === true ) {
                        if ( $('.ant_indicator_for_text:not(.ant_dont_show)').length < ANT.group.initial_pin_limit ) {
                            if ( $indicators.length == 1 ) $indicators.removeClass('ant_dont_show');
                        }
                    } else {
                        //todo: this works for now, but use a different signal later
                        if ( $indicators.length == 1 ) $indicators.removeClass('ant_dont_show');
                    }

                },
                hide: function(hashes){
                    //ANT.actions.indicators.hide:
                    //hashes should be an array or a single hash string
                    //it fails gracefully if there are no indicators for the hashed container ( $indcators will just be empty and do nothing )
                    var $indicators = this.fetch(hashes);
                    $indicators.css({
                        'opacity':'0',
                        'visibility':'hidden'
                    });
                },
                fetch: function(hashOrHashes){
                    //ANT.actions.indicators.fetch:
                    //a helper to get an $indicators obj from a hash or list of hashes
                    var $indicators = $();
                    if( typeof hashOrHashes === "string" ){
                        var hash = hashOrHashes;
                        $indicators = $('#ant_indicator_'+hash);
                    }
                    else{
                        //should be an array of hashes
                        var hashes = hashOrHashes;
                        $.each(hashes, function(idx, hash){
                            $indicators = $indicators.add( $('#ant_indicator_'+hash) );
                        });
                    }
                    return $indicators;
                },
                init: function(hash, showIndicator){
                    //ANT.actions.indicators.init:
                    //note: this should generally be called via ANT.actions.containers.setup
                    
                    //note: I believe this is being double called for text right now, but it's not hurting anything... fix later though.
                    var scope = this;
                    var summary = ANT.summaries[hash];
                    var showIndicator = (showIndicator) ? showIndicator:false;
                    if (typeof summary != "undefined" && summary.$container.hasAttr('ant-node')) {
                        var kind = summary.kind,
                            $container = summary.$container,
                            indicatorId = 'ant_indicator_'+hash,
                            indicatorBodyId = 'ant_indicator_body_'+hash,
                            indicatorDetailsId = 'ant_indicator_details_'+hash;

                        // don't insert floating pins for page-level interactions
                        if ( $container.hasAttr('ant-page-container') ) return;
                        //else

                        $container.attr('ant-hasIndicator', 'true');
                        if ( $container.hasAttr('ant-item') ) {
                            var customDisplayName = $container.attr('ant-item'),
                                $indicator = summary.$indicator = $container, // might work?  $indicator is storing important data...
                                $counter = $('[ant-counter-for="'+customDisplayName+'"]'),
                                // $grid = $('[ant-view-reactions-for="'+customDisplayName+'"]'),
                                $cta = $('[ant-cta-for="'+customDisplayName+'"]');

                            // some init.  does this make sense here?
                            _setupHoverToFetchContentNodes();

                            // if there is a counter on the page
                            if ( $counter.length ) {
                                $counter.addClass('ant_count');
                            }
                            if ( $cta.length ) {
                                _customDisplaySetupHoverForShowAWindow($cta);
                                _showAWindowAfterLoad();
                            }
                            // if ( $grid.length ) {
                            // }
                            ANT.actions.indicators.update(hash);

                        } else {
                            //check for and remove any existing indicator and indicator_details and remove for now.
                            //this shouldn't happen though.
                            //todo: solve for duplicate content that will have the same hash.
                            $('#ant_indicator_'+hash).remove();
                            $('#ant_container_tracker_'+hash).remove();
                            $('#ant_indicator_details_'+hash).remove();

                            if ($('#ant_indicator_'+hash).length) {
                                return;
                            }
                            var $indicator = summary.$indicator = $('<div class="ant_indicator"><div class="ant ant_indicator_container" /></div>').attr('id',indicatorId).data('hash',hash);
                            if (kind!='text' && ANT.group.img_indicator_show_onload===true) { $indicator.addClass('ant_show_on_load'); }
                            // //init with the visibility hidden so that the hover state doesn't run the ajax for zero'ed out indicators.
                            // $indicator.css('visibility','hidden');

                            _setupIndicators();

                            if(!kind){
                                //todo: I'll look into the source of this this, but this should work fine for now.
                                // ANT.safeThrow('indicator container has no kind attribute');
                                return;
                            }
                            //run setup specific to this type
                            ANT.actions.indicators.utils.kindSpecificSetup[kind]( hash, showIndicator );


                            //todo: combine this with the kindSpecificSetup above right?
                            if (kind == 'text'){
                                function _getTextNodesIn(el) {
                                    // return true;  // testing to fix WRAL.
                                    return $(el).find(":not(iframe,noscript)").andSelf().contents().filter(function() {
                                        return this.nodeType == 3;
                                    });
                                }

                                // if it's an element that just contains an image, don't hash the "text" element.
                                // <p><img src="..."/></p>
                                if ( $container.find('img').length && !_getTextNodesIn($container).length ) {
                                    ANT.actions.stripAntNode($container);
                                    return;
                                }



                                $container.off('.ant_helper');
                                // todo: touchHover
                                
                                if(!isTouchBrowser){
                                    $container.on('mouseenter.ant_helper', function() {
                                        var hasHelper = $indicator.hasClass('ant_helper') && ANT.group.paragraph_helper;
                                        if ( hasHelper) {
                                            ANT.actions.indicators.helpers.over($indicator);
                                        }
                                    });
                                    $container.on('mouseleave.ant_helper', function(e) {
                                        var hasHelper = $indicator.hasClass('ant_helper') && ANT.group.paragraph_helper;
                                        if ( hasHelper ) {
                                            ANT.actions.indicators.helpers.out($indicator);
                                        }
                                    });
                                } else {
                                    $container.on('touchstart.ant',function(e) {
                                        if ($(e.target).closest('a').length !== 0) { return; }
                                        ANT.util.timerStart = new Date().getTime();
                                    });
                                    $container.off('touchend.ant').on('touchend.ant', function(e){
                                        if ($(e.target).closest('a').length !== 0) { return; }

                                        ANT.util.timerEnd = new Date().getTime();
                                        var touchTime = ANT.util.timerEnd - ANT.util.timerStart;

                                        // e.stopPropagation();
                                        // if (ANT.util.bubblingEvents['dragging'] == true ) { return; }
                                        if ( ANT.util.isTouchDragging(e) || touchTime > 500 ) { return; }
                                        if (ANT.util.bubblingEvents['touchend'] == false) {
                                            if ( !$('.ant_window').length ) {
                                                var $this_container = $('[ant-hash="'+hash+'"]');
                                                // var $container = $(e.target);

                                                var el = $this_container[0]
                                                $('document').selog('selectEl', el);

                                                var $aWindow = ANT.aWindow.make( "writeMode", {hash:hash} );
                                            } else {
                                                ANT.actions.UIClearState();
                                            }
                                        }
                                    });
                                }

                                //This will be either a helperIndicator or a hidden indicator
                                var isZeroCountIndicator = !( summary.counts.tags > 0 );
                                // var isZeroCountIndicator = (typeof summary.counts.highest_tag_count == 'undefined') ? true:false;

                                $indicator.data('isZeroCountIndicator', isZeroCountIndicator);
                                if(isZeroCountIndicator){
                                    $indicator.addClass('ant_helper');
                                    // if(isTouchBrowser){
                                    //     $indicator.addClass('isTouchBrowser');
                                    // }
                                    _setupHoverForShowAWindow();
                                }else{
                                    _setupHoverToFetchContentNodes(function(){
                                        _showAWindowAfterLoad();
                                    });
                                    _setupHoverForShowAWindow(); // used to be in the above callback.  test.
                                }
                            }

                            //of course, don't pass true for shouldReInit here.
                            ANT.actions.indicators.update(hash);

                        } // /else of if (ant-item) conditional
                    }

                    /*helper functions */
                    function _setupIndicators(){

                        //$indicator_body is used to help position the whole visible part of the indicator away from the indicator 'bug' directly at 
                        var $indicator_body = summary.$indicator_body = $('<div class="ant ant_indicator_body " />')
                            .attr('id',indicatorBodyId)
                            .appendTo($indicator.find('.ant_indicator_container'))
                            .append(
                                '<span class="ant-antenna-logo"></span>',
                                '<span class="ant_count" />', //the count will get added automatically later, and on every update.
                                '<span class="ant_count_label" />' 
                            );

                        $indicator.css('visibility','visible');
                    }



                    function _setupHoverForShowAWindow(){
                        // HOVERTIMER
                        if (!isTouchBrowser) {
                            var isZeroCountIndicator = !( summary.counts.tags > 0 );
                            $indicator.find('.ant_indicator_body').on('mouseenter.ant', function(){
                                ANT.util.setFunctionTimer( function() {
                                    if( isZeroCountIndicator ){
                                        _updateAWindowForHelperIndicator();
                                    } else {
                                        _makeAWindow();
                                    }
                                } , 333);


                            }).on('mouseleave.ant', function() {
                                // kill the timer and prevent the aWindow from showing
                                ANT.util.clearFunctionTimer();
                            });
                        } else {
                            $indicator.on('touchend.ant', function(e){
                                // if (ANT.util.bubblingEvents['dragging'] == true ) { return; }
                                if ( ANT.util.isTouchDragging(e) ) { return; }
                                ANT.util.bubblingEvents['touchend'] = true;

                                _makeAWindow();
                                var hasHelper = $indicator.hasClass('ant_helper') && ANT.group.paragraph_helper;
                                if( hasHelper ){
                                    // ANT.events.track('paragraph_helper_engage');
                                }
                            });
                        }
                    }
                    function _makeAWindow(){
                        //only allow one indicator aWindow.
                        //todo - replace this with the code below - but need to deal with selstate hilites first
                        if($indicator.$aWindow){
                            // dont rewrite the window if it already exists...
                            // adding to prevent tagBox text animation.  if this is problematic, just go prevent the animation but let this redraw.
                            if ( $indicator.$aWindow.data('container') == hash ) { return; }
                            $indicator.$aWindow.remove();
                        }

                        var page_id = ANT.util.getPageProperty('id', hash );
                        ANT.events.trackEventToCloud({
                            // category: "engage",
                            // action: "aWindow_shown_readmode",
                            // opt_label: "kind: text, hash: " + hash,
                            event_type: 'rs',
                            event_value: (typeof summary.counts.highest_tag_count != 'undefined') ? 'rd':'rd-zero',
                            container_hash: hash,
                            container_kind: "text",
                            page_id: page_id
                        });
                        ANT.events.emit('antenna.reactionview', '', { 'hash':hash, 'kind':'text' });

                        // if(summary.$aWindow){
                        //     summary.$aWindow.remove();
                        // }
                        // if(summary.$aWindow_readmode){
                        //     summary.$aWindow_readmode.remove();
                        // }
                        //end - todo

                        var $aWindow = ANT.aWindow.make( "readMode", {hash:hash} );
                        

                        //This bug goes all the way back to the big-ol-nasty function ANT.aWindow._aWindowTypes.writeMode.make.
                        //fix later, but it's fine to return here - must be getting called twice and will build correctly the 2nd time.
                        if(!$aWindow){
                            return;
                        }

                        $indicator.$aWindow = $aWindow;
                        
                        //these should probably be moved under tagMode.make (called by aWindow.make) where the image tracking lives.
                        // if( $indicator.data('isZeroCountIndicator') ){
                        //     _updateAWindowForHelperIndicator();

                            // ANT.events.track('paragraph_helper_show');

                            // DONT FIRE... too many events
                            // ANT.events.trackEventToCloud({
                            //     // category: "engage",
                            //     // action: "aWindow_shown_indicatorhelper",
                            //     // opt_label: "kind: text, hash: " + hash,
                            //     event_type: 'aWindow_show',
                            //     event_value: 'indicator_helper',
                            //     container_hash: hash,
                            //     container_kind: "text",
                            //     page_id: page_id
                            // });
                        // }else{
                            // ANT.events.track( 'view_node::'+hash, hash );
                        // }

                    }
                    function _updateAWindowForHelperIndicator(){
                        // for some reason, if we don't do re-set the $indicator, and the indicator is positioned absolutely, we get bad values returned
                        var $indicator = $('#ant_indicator_'+hash);
                        var actionbarCoords = {
                            force:true,
                            top: $indicator.offset().top+11,
                            left: $indicator.offset().left-8
                        };

                        var clickAction = function() {
                            // $aWindow.remove();
                            var $container = $('[ant-hash="'+hash+'"]');
                            var el = $container[0]
                            $('document').selog('selectEl', el);
                            $aWindow = ANT.aWindow.make( "writeMode", {coords:actionbarCoords,hash:hash} );
                            $container.removeClass('ant_live_hover');
                        };

                        var $actionbar = ANT.actionbar.draw({
                            coords:actionbarCoords,
                            kind:"text",
                            // content:selected.text,
                            hash:hash,
                            clickAction:clickAction
                        });

                        // var $aWindow = $indicator.$aWindow;
                        // var $header = ANT.aWindow.makeHeader( ANT.t('main_cta') );
                        // $aWindow.addClass('ant_helper_aWindow');
                        // $aWindow.find('.ant_header').replaceWith($header);
                        // // $header.append('<div class="ant_header_arrow"><img src="'+ANT_staticUrl+'widget/images/header_up_arrow.png" /></div>');
                        // $aWindowBody = $('<div class="ant_body ant_visiblePanel" />');
                        // $aWindowBody.html('');
                        // $aWindow.find('div.ant_body_wrap').append($aWindowBody);
                        // ANT.aWindow.updateFooter( $aWindow, '<span class="ant_cta_msg">Click to respond</span>' );
                        // $aWindow.find('.ant_footer').addClass('ant_cta').find('.ant_cta_msg').click( function() {
                        //     $aWindow.remove();
                        //     var $container = $('[ant-hash="'+hash+'"]');
                        //     var el = $container[0]
                        //     $('document').selog('selectEl', el);
                        //     $aWindow = ANT.aWindow.make( "writeMode", {hash:hash} );
                        // });

                        // ANT.aWindow.updateSizes(
                        //     $aWindow, {
                        //         noAnimate:true
                        //     }
                        // );
                    }


                    function _setupHoverToFetchContentNodes(callback){                        
                        //Note that the text indicators still don't have content_node info.
                        //The content_nodes will only be populated and shown after hitting the server for details triggered by $indicator mouseover.
                        //Setup callback for a successful fetch of the content_nodes for this container
                        //bind the hover event that will only be run once.  It gets removed on the success callback above.


                        if (isTouchBrowser) {
                           if ( !$indicator.hasAttr('ant-item') ) {
                                ANT.actions.content_nodes.init(hash, callback);
                            } 
                        } else {
                            $indicator.on( 'mouseover.contentNodeInit' , function(){
                                // not sure about this, but we're not initializing ON MOUSEOVER the content nodes for a node w/ custom display
                                if ( !$indicator.hasAttr('ant-item') ) {
                                    ANT.actions.content_nodes.init(hash, callback);
                                }
                            });
                        }
                    }
                    function _showAWindowAfterLoad(){
                        $indicator.off('mouseover.contentNodeInit');
                        if (isTouchBrowser) {
                            $indicator.triggerHandler('touchend.showAWindow');
                        } else {
                            $indicator.triggerHandler('mouseover.showAWindow');
                        }
                    }

                    function _customDisplaySetupHoverForShowAWindow($cta){
                        // SUPPORTS ONE:
                        // $cta.on('mouseover.showAWindow', function(){
                        //     _customDisplayMakeAWindow($cta);
                        //     var hasHelper = $indicator.hasClass('ant_helper') && ANT.group.paragraph_helper;
                        //     if( hasHelper ){
                        //         // ANT.events.track('paragraph_helper_engage');
                        //     }
                        // });
                        // SUPPORTS TWO:
                        $cta.each( function() {
                            var $thisCTA = $(this);
                            $thisCTA.attr('ant-kind', kind).off('mouseover.showAWindow, touchend.showAWindow').on('mouseover.showAWindow, touchend.showAWindow', function(){
                                _customDisplayMakeAWindow($thisCTA);
                                // var hasHelper = $indicator.hasClass('ant_helper') && ANT.group.paragraph_helper;
                                // if( hasHelper ){
                                    // ANT.events.track('paragraph_helper_engage');
                                // }
                            });
                        });
                    }
                    function _customDisplayMakeAWindow($cta) {
                        // see if this is a read+write mode cta, or just one "mode"
                        if ( $cta.attr('ant-mode').indexOf('write') != -1 && $cta.attr('ant-mode').indexOf('read') != -1 ) {
                            var mode = ( summary.counts.tags > 0 ) ? "readMode":"writeMode";
                        } else {
                            var mode = ( $cta.attr('ant-mode') == "write" ) ? "writeMode":"readMode";
                        }

                        //todo - replace this with the code below - but need to deal with selstate hilites first
                        if($indicator.$aWindow && $indicator.$aWindow.hasClass('ant_'+mode.toLowerCase() ) ){
                            // dont rewrite the window if it already exists...
                            // adding to prevent tagBox text animation.  if this is problematic, just go prevent the animation but let this redraw.
                            if ( $indicator.$aWindow.data('container') == hash ) { return; }
                            $indicator.$aWindow.remove();
                        }

                        // if(summary.$aWindow){
                        //     summary.$aWindow.remove();
                        // }
                        // if(summary.$aWindow_readmode){
                        //     summary.$aWindow_readmode.remove();
                        // }
                        //end - todo
                        if (mode=="writeMode") {
                            if($container.length){
                                el = $container[0];
                            }else{
                                // hash = hash || testHash;
                                var selector = '[ant-hash="' + hash + '"]';
                                el = $(selector)[0];
                            }
                            $('document').selog('selectEl', el);
                        }

                        ANT.events.emit('antenna.reactionview', '', { 'hash':hash, 'kind':'custom', 'mode':mode, 'ant-item-name':$cta.attr('ant-cta-for')  });

                        var $aWindow = ANT.aWindow.make( mode, {hash:hash, '$custom_cta':$cta } );
                        $aWindow.addClass('ant_rewritable');
                        var page_id = ANT.util.getPageProperty('id', hash );

                        //This bug goes all the way back to the big-ol-nasty function ANT.aWindow._aWindowTypes.writeMode.make.
                        //fix later, but it's fine to return here - must be getting called twice and will build correctly the 2nd time.
                        if(!$aWindow){
                            return;
                        }

                        $indicator.$aWindow = $aWindow;
                    }
                },
                update: function(hash, shouldReInit){
                    //ANT.actions.indicators.update:

                    var scope = this;
                    var summary = ANT.summaries[hash],
                        kind = summary.kind,
                        $container = summary.$container,
                        isText = summary.kind === 'text';

                    if ( summary.counts.tags === 0 && typeof summary.content_nodes != 'undefined' ) {
                        $.each( summary.content_nodes, function(idx, content_node) {
                            summary.counts = $.extend(true, {}, content_node.counts );
                            summary.top_interactions = $.extend(true, {}, content_node.top_interactions );
                        });
                    }

                    // for now, separately handle the "custom display" elements
                    if ( $container.hasAttr('ant-item') ) {
                            var customDisplayName = $container.attr('ant-item'),
                            $indicator = summary.$indicator = $container, // might work?  $indicator is storing important data..,
                            $counter = $('[ant-counter-for="'+customDisplayName+'"]'),
                            $label = $('[ant-reactions-label-for="'+customDisplayName+'"]'),
                            // $grid = $('[ant-view-reactions-for="'+customDisplayName+'"]'),
                            $cta = $('[ant-cta-for="'+customDisplayName+'"]'),
                            $cta_container = $cta.parent();

                        // some init.  does this make sense here?

                            // if there is a counter on the page
                            if ( $counter.length ) {
                                if ( summary.counts.tags > 0 ) {
                                    if ( summary.counts.tags > 1 ) { $label.text('Reactions'); } else { $label.text('Reaction'); }
                                    $counter.html( ANT.commonUtil.prettyNumber( summary.counts.tags ) );
                                // } else if ( typeof summary.content_nodes != 'undefined' ) {
                                    // $.each( summary.content_nodes, function(idx, content_node) {
                                    //     summary.counts = $.extend(true, {}, content_node.counts );
                                    //     summary.top_interactions = $.extend(true, {}, content_node.top_interactions );
                                    // });
                                    // $counter.html( ANT.commonUtil.prettyNumber( content_node_summary.counts.tags ) );
                                // } else {
                                    // $counter.html('0');
                                }
                            }
                            if ( $cta.length && summary.counts.tags > 0 ) {
                                // var bgColorRGB0 = ( ANT.util.hexToRgb( ANT.group.tag_box_bg_colors[0] ) ) ? ANT.util.hexToRgb( ANT.group.tag_box_bg_colors[0] ) : ANT.group.tag_box_bg_colors[0];
                                // var textColorRGB0 = ( ANT.util.hexToRgb( ANT.group.tag_box_text_colors[0] ) ) ? ANT.util.hexToRgb( ANT.group.tag_box_text_colors[0] ) : ANT.group.tag_box_text_colors[0];
                                // var bgColorRGB1 = ( ANT.util.hexToRgb( ANT.group.tag_box_bg_colors[1] ) ) ? ANT.util.hexToRgb( ANT.group.tag_box_bg_colors[1] ) : ANT.group.tag_box_bg_colors[1];
                                // var textColorRGB1 = ( ANT.util.hexToRgb( ANT.group.tag_box_text_colors[1] ) ) ? ANT.util.hexToRgb( ANT.group.tag_box_text_colors[1] ) : ANT.group.tag_box_text_colors[1];

                                var topReactions = [],
                                    topReactionsLimit = (summary.counts.tags===1) ? 1:2;

                                    if ( !$.isEmptyObject(summary.top_interactions.tags) ) {
                                        $.each( summary.top_interactions.tags, function( tag_id, tag_data ) {
                                            for (var k=0; k < ANT.group.default_reactions.length; k++ ) {
                                                var currentDefault = ANT.group.default_reactions[k];
                                                if ( parseInt(tag_id) === currentDefault.id && topReactions.length < topReactionsLimit ) {

                                                    topReactions.push( tag_data );
                                                }
                                            }
                                        });
                                    }

                                var show_expanded = false;
                                if (isMobile && (ANT.group.separate_cta_expanded == 'both' || ANT.group.separate_cta_expanded == 'mobile') ) {
                                    show_expanded = true;
                                }
                                if (!isMobile && (ANT.group.separate_cta_expanded == 'both' || ANT.group.separate_cta_expanded == 'desktop') ) {
                                    show_expanded = true;
                                }
                                if (show_expanded === true && topReactions.length && !$cta_container.find('.ant-top-tags').length) {
                                    $cta.append(
                                        '<div class="ant-top-tags"><div class="ant-top-tags-wrapper">' +
                                        ( topReactions[0] ? '<div class="ant-top-tag">'+topReactions[0].body+' <span>('+topReactions[0].count+')</span></div>' : '' ) +
                                        ( topReactions[1] ? '<div class="ant-top-tag">'+topReactions[1].body+' <span>('+topReactions[1].count+')</span></div>' : '' ) +
                                        '</div></div>'
                                    );
                                }
                            }

                            // if ( $grid.length ) {
                            // }
                    } else {

                        //re-init if we want a 'hard reset'
                        if(shouldReInit){
                        
                            if(isText){
                                //damn it - kill them all!  Dont know why the helpers were still adding a second indicator
                                $container.closest('[ant-node]').find('.ant_indicator').remove();
                            }else{
                                // summary.$indicator.remove();
                                // $('#ant_container_tracker_'+hash).remove();
                            }

                            ANT.actions.indicators.init(hash);
                            //this will loop back from the .init, which does not pass true for shouldReInit - so no infinite loop.
                            return;
                        }
                        
                        var $indicator = summary.$indicator,
                            $indicator_body = summary.$indicator_body,
                            $indicator_details = summary.$indicator_details;

                        //$indicator_body is used to help position the whole visible part of the indicator away from the indicator 'bug' directly at
                        var $count = $indicator_body.find('.ant_count'),
                            $count_label = $indicator_body.find('.ant_count_label'),
                            $details_header_count = ($indicator_details) ? $indicator_details.find('div.ant_header h1'):false,
                            hasReactions = summary.counts.tags > 0;

                        var reactionLabel = (summary.counts.tags>1) ? ANT.t('plural_reaction') : ANT.t('single_reaction');
                        if ( hasReactions ) {
                            if (isText) {
                                $count.html( ANT.commonUtil.prettyNumber( summary.counts.tags ) );
                                $count_label.text(reactionLabel);
                            } else {
                                // $count.html( ANT.commonUtil.prettyNumber( summary.counts.tags ) + ' ' + reactionLabel );
                                $count.html( ANT.commonUtil.prettyNumber( summary.counts.tags ) + ' ' );
                                // $count_label.html( reactionLabel );
                            }
                            if ($details_header_count) $details_header_count.html( ANT.commonUtil.prettyNumber( summary.counts.tags ) + " " + ANT.t('plural_reaction') );

                            // ANT.actions.indicators.show(hash);
                            
                        } else {
                            $indicator.addClass('ant_no_reactions');
                            $count.html( '<span class="ant_react_label">'+ANT.t('main_cta')+'</span>' );
                            
                            if(isText){
                                if(ANT.group.paragraph_helper){
                                    ANT.actions.indicators.show(hash);
                                    $indicator.addClass('ant_helper');
                                    // if(isTouchBrowser){
                                    //     $indicator.addClass('isTouchBrowser');
                                    // }
                                }else{
                                    ANT.actions.indicators.hide(hash);
                                }                                                        
                            }
                        }
                    }

                },
                helpers: {
                    //ANT.actions.indicators.helpers:
                    over: function($indicator){
                        //ANT.actions.indicators.helpers.over:

                        // ANT.events.track('paragraph_helper_show');

                        // var alreadyHovered = $indicator.data('containerHover');
                        // if( alreadyHovered ){
                            // return;
                        // }

                        // fade in.
                        // removing for now. UI feedback was "I didn't see that" from a small sample.
                        // $indicator.data('containerHover', true);
                        // var hoverTimeout = setTimeout(function(){
                        //     var hasHover = $indicator.data('containerHover');
                            
                        //     if(hasHover){
                                
                        //         ANT.util.cssSuperImportant( $indicator, { display:"inline" });
                                
                        //         // $indicator
                        //         //     .css('opacity',0)
                        //         //     .animate({
                        //         //         'opacity': ANT.C.helperIndicators.opacity
                        //         //         }, ANT.C.helperIndicators.fadeInTime );
                        //     }
                        // }, ANT.C.helperIndicators.hoverDelay);
                        // $indicator.data('hoverTimeout', hoverTimeout);
                        // if(isTouchBrowser){
                            // $indicator.css({ display:"inline" });
                        // }else{
                            ANT.util.cssSuperImportant( $indicator, { display:"inline" });
                        // }
                        $indicator.css('opacity', ANT.C.helperIndicators.opacity);
                    },
                    out: function($indicator){
                        //ANT.actions.indicators.helpers.out:
                        //temp hack
                        //don't fade it out if the aWindow is showing
                            // var hash = $indicator.data('hash');
                            // var summary = ANT.summaries[ hash ];
                            // var $aWindow = (typeof summary != "undefined" && typeof summary.$aWindow_readmode != "undefined") ? summary.$aWindow_readmode:null;
                            // if( $aWindow && $aWindow.is(':visible') ){
                            //     // return;
                            // }
                        if ( $indicator && ($indicator.hasClass('ant_dont_show') || $indicator.hasClass('ant_no_reactions')) ) {
                            $indicator.css('opacity', 0);
                        }

                        // $indicator.data('containerHover', false);
                        // var hoverTimeout = $indicator.data('hoverTimeout');
                        // clearTimeout(hoverTimeout);
                        // if(isTouchBrowser){
                            // $indicator.css({ display:"none" });
                        // }else{
                            // ANT.util.cssSuperImportant( $indicator, { opacity:0 });
                            // ANT.util.cssSuperImportant( $indicator, { display:"none" });
                        // }
                    }
                },
                utils:{
                    checkTrailingWhiteSpace: function($container){
                        //ANT.actions.indicators.utils.checkTrailingWhiteSpace:

                        var reversedNodes = $container.children().get().reverse();

                        var startOfTrailingWhiteSpace = null;
                        var isConsecutive = true;
                        $.each(reversedNodes, function(idx) {
                            if(!isConsecutive){
                                return;
                            }
                            var isWhiteSpace = $(this).text() == "";
                            if(isWhiteSpace){
                                startOfTrailingWhiteSpace = this;
                            }else{
                                isConsecutive = false;
                            }
                        });
                        return startOfTrailingWhiteSpace;
                    },
                    //ANT.actions.indicators.utils:
                    kindSpecificSetup: {
                        img: function( hash, showIndicator ){
                            var summary = ANT.summaries[hash],
                                $container = summary.$container,
                                $indicator = summary.$indicator,
                                $indicator_body = summary.$indicator_body,
                                $container_tracker_wrap = $('#ant_container_tracker_wrap'),
                                $container_tracker = $('<div class="ant_container_tracker" />'),
                                indicatorDetailsId = 'ant_indicator_details_'+hash,
                                page_id = ANT.util.getPageProperty('id', hash );

                            if( $container.width() < 100 ){
                                ANT.safeThrow('Too small to init.');
                                return;
                            }

                            if( $container.css('display') == 'none' || $container.css('visibility') == 'hidden' ){
                                ANT.safeThrow('not visible: ');
                                return;
                            }

                            var $existing = $('#ant_container_tracker_'+hash);
                            if($existing.length){
                                ANT.safeThrow('Images are not expected to get re-inited.');
                                return;
                            }

                            $container_tracker.attr('id', 'ant_container_tracker_'+hash).appendTo($container_tracker_wrap);
                            //position the containerTracker at the top left of the image or videos.  We'll position the indicator and hiliteborder relative to this.

                            _commonSetup();
                            $indicator.appendTo($container_tracker);
                            
                            if(isTouchBrowser){
                                $indicator.on('touchend.ant', function(e){
                                    // if (ANT.util.bubblingEvents['dragging'] == true ) { return; }
                                    if ( ANT.util.isTouchDragging(e) ) { return; }
                                    if (ANT.util.bubblingEvents['touchend'] == false) {
                                        if ( summary.counts.interactions == 0 ) {
                                            var $aWindow = ANT.aWindow.make( "writeMode", {hash:hash} );
                                        } else {
                                            var $aWindow = ANT.aWindow.make( "readMode", {hash:hash} );    
                                        }
                                        $(this).addClass('ant_live_hover');
                                    }
                                });
                            }else{
                                $indicator
                                    .on('mouseenter.ant', function() {
                                        $indicator.addClass('ant_visible');
                                        ANT.util.setFunctionTimer( function() {
                                            if ( summary.counts.interactions == 0 ) {
                                                var $aWindow = ANT.aWindow.make( "writeMode", {hash:hash} );
                                            } else {
                                                var $aWindow = ANT.aWindow.make( "readMode", {hash:hash} );    
                                            }
                                            $(this).addClass('ant_live_hover');
                                        } , 200);
                                    })//chain
                                    .on('mouseleave.ant', function() {
                                        ANT.util.clearFunctionTimer();
                                        $(this).removeClass('ant_live_hover ant_visible');
                                    });
                            }

                            //todo: move this from init
                            ANT.actions.indicators.utils.updateContainerTracker(hash);

                            /*debug*/
                            // $('#ant_indicator_'+hash).addClass('ant_visible');

                            function _commonSetup(){
                                // NEWVIDEO TEST
                                // deprecated?
                                if ( $('div.ant_media_details').not('ant_loaded').length ) {
                                    var $indicator_details = summary.$indicator_details = $('<div />').attr('id',indicatorDetailsId)//chain
                                        .addClass('ant ant_indicator_details ant_widget ant_widget_bar');

                                    $('div.ant_media_details').html( $indicator_details );
                                    $container_tracker.addClass('ant_inline_video');
                                    
                                    //what is this?  There should only be one sandbox right?
                                    $('div.ant_media_details').addClass('ant_sandbox');
                                } else {
                                    var $indicator_details = summary.$indicator_details = $('<div />').attr('id',indicatorDetailsId)//chain
                                    .addClass('ant ant_indicator_details ant_widget ant_widget_bar')//chain
                                    .appendTo('#ant_indicator_details_wrapper');
                                }

                                $indicator_details.data('container',hash);
                                //later we should consolodate the use of 'container' and 'hash' as the key
                                $indicator_details.data('hash',hash);
                                $indicator_details.data('summary',summary);

                                $indicator_details.addClass('ant_indicator_details_for_media').click(
                                    function() {
                                        $indicator_details.addClass('ant_live_hover');
                                        ANT.actions.containers.media.onEngage( hash );
                                    }
                                );

                                $indicator.addClass('ant_indicator_for_media ant_indicator_for_media_inline').find('.ant_indicator_body');
                                if(isTouchBrowser){
                                    $indicator.on('touchend.ant', function(){
                                        $(this).toggleClass('ant_hover');
                                    });
                                }
                            }

                        },
                        media: function( hash, showIndicator ){
                            //for now just treat it like an img
                            this.img( hash );
                        },
                        text: function( hash, showIndicator ){
                            var summary = ANT.summaries[hash],
                                $container = summary.$container,
                                $indicator = summary.$indicator,
                                $indicator_body = summary.$indicator_body,
                                $actionbar = $('ant_actionbar_'+hash);


                            // $indicator.addClass('ant_indicator_for_text');  //.addClass('ant_dont_show');

                            if (showIndicator === false) {
                                $indicator.addClass('ant_indicator_for_text').addClass('ant_dont_show');
                            } else {
                                $indicator.addClass('ant_indicator_for_text');
                            }

                            var startOfTrailingWhiteSpace = ANT.actions.indicators.utils.checkTrailingWhiteSpace($container);

                            if(startOfTrailingWhiteSpace){
                                $(startOfTrailingWhiteSpace).before($indicator);
                            }else{
                                $indicator.appendTo($container);
                            }
                        }
                    },
                    makeDetailsContent: function( hash ){
                        //ANT.actions.indicators.utils.makeDetailsContent:
                        var scope = this;
                        var summary = ANT.summaries[hash],
                            $container = summary.$container,
                            $indicator = summary.$indicator,
                            $indicator_body = summary.$indicator_body,
                            $indicator_details = summary.$indicator_details,
                            $actionbar = $('ant_actionbar_'+hash);

                        if ( typeof $indicator != "undefined" ) {
                            //just rebuild them
                            $indicator_details.find('div.ant_body_wrap').remove();
                            // $oldDetails.remove();

                            //update the header
                            var headerText = ANT.aWindow.makeDefaultPanelMessage($indicator_details);
                            var $header = ANT.aWindow.makeHeader( headerText );
                            
                            var $bodyWrap = $('<div class="ant ant_body_wrap ant_clearfix" />');
                                

                            var kind = summary.kind;
                            var isMediaContainer = kind=="img" ||
                                kind=="image" ||  // [pb] really?
                                kind=="imgage" ||
                                kind=="med" ||
                                kind=="media";

                            //builds out the $tagsList contents
                            if (isMediaContainer && !$indicator_details.find('div.ant_view_success').length ){
                                $indicator_details.data( 'initialWidth', $container.width() );
                            }

                            var $aWindow = $indicator_details;

                            var $tagsListContainer = ANT.actions.indicators.utils.makeTagsListForInline( $aWindow );

                            $bodyWrap.append($tagsListContainer);

                            $indicator_details.empty().append( $header, $bodyWrap );
                        }
                    },

                    //move these from indicators-  they dont belong here
                    makeTagsListForInline: function( $aWindow, isWriteMode, page ){
                        //ANT.actions.indicators.utils.makeTagsListForInline:
                        // page is the page object, not a boolean

                        var hash = $aWindow.data('hash') || $aWindow.attr('ant-hash');
                        
                        var isPage = !hash || hash == "page";

                        var summary = !isPage ? ANT.summaries[hash] : {};

                        var default_reactions = ANT.groupSettings.getBlessedTags(hash);

                        var reactionViewStyle = $aWindow.attr('ant-view-style') || 'grid';

                        // For IE8 and earlier version.
                        if (!Date.now) {
                          Date.now = function() {
                            return new Date().valueOf();
                          }
                        }

                        var $tagsListContainer = $('<div class="ant_body ant_tags_list ant_'+reactionViewStyle+'" style="background:'+ANT.group.tags_bg_css+'" />').data('now', Date.now());
                            // $tagsListContainerCopy = $('<div class="ant_body ant_tags_list" />').data('now', Date.now());  // wtf
                        
                        var $existingTagslist = $aWindow.find('.ant_tags_list');
                        
                        $aWindow.find('.ant_body_wrap').append($tagsListContainer);

                        $existingTagslist.remove();

                        if ( typeof page != "undefined" ) {
                            // page-level / summary bar
                            if ( !isWriteMode && page.toptags.length ) {
                                // write page-level tags: readmode

                                // actually, these should always be sorted already - dont think we need this.
                                // ANT.actions.summaries.sortByTags(page.toptags);

                                writeTagBoxes( page.toptags );
                                ANT.aWindow.updateFooter( $aWindow, '<span class="ant_cta_msg">'+ANT.t('main_cta')+'</span>' );
                                $aWindow.find('.ant_footer').addClass('ant_cta').find('span.ant_cta_msg').click( function() {
                                    $aWindow.remove();
                                    $aWindow = ANT.aWindow.make( "writeMode", { hash:'page', page:page, is_page:true } );
                                });
                            } else {
                                // write page-level tags: writemode
                                var $header = ANT.aWindow.makeHeader( ANT.t('main_cta') ),
                                    isWriteMode = true;
                                $aWindow.find('.ant_header').replaceWith($header);
                                writeTagBoxes(default_reactions);
                                var $custom_tagBox = ANT.aWindow.writeCustomTag( $tagsListContainer, $aWindow );
                                // $aWindow.removeClass('ant_rewritable');

                            }
                        } else if ( isWriteMode ) {
                            // write inline tags: writemode
                            writeTagBoxes(default_reactions);
                        } else if(isPage){
                            //do nothing
                            // whiskey tango...?
                        } else {
                            if ( !$.isEmptyObject(summary.top_interactions.tags) ) {
                                // write inline tags: readmode, for all content types (kind)
                                ANT.actions.summaries.sortInteractions(hash);
                                writeTagBoxes( summary.interaction_order );
                                if ( summary.kind =="text" ) {
                                    // if ( !summary.crossPage ) {
                                        ANT.aWindow.updateFooter( $aWindow, '<span class="ant_cta_msg">'+ANT.t('main_cta')+'</span>' );
                                        $aWindow.find('.ant_footer').addClass('ant_cta').find('.ant_cta_msg').click( function() {
                                            $aWindow.remove();
                                            var $container = $('[ant-hash="'+hash+'"]');
                                            var el = $container[0]
                                            $('document').selog('selectEl', el);
                                            $aWindow = ANT.aWindow.make( "writeMode", {hash:hash} );
                                        });
                                    // }
                                } else {

                                    ANT.aWindow.updateFooter( $aWindow, '<span class="ant_cta_msg">'+ANT.t('main_cta')+'</span>' );
                                    $aWindow.find('.ant_footer').addClass('ant_cta').find('.ant_cta_msg').click( function() {
                                        var offsets = $aWindow.offset();
                                        var coords = { left:offsets.left, top:offsets.top, force:true }; // ugh, force is a one-time override
                                        $aWindow.remove();
                                        $aWindow = ANT.aWindow.make( "writeMode", {hash:hash, coords:coords} );
                                    });
                                }
                            } else {
                                // no t() not used?
                                ANT.aWindow.updateFooter( $aWindow, '<span class="ant_no_reactions_msg ant_clearfix">No reactions yet!</span>' );
                            }
                        }

                        // mode-specific addition functionality that needs to precede writing the $aWindow to the DOM
                        if ( typeof page == "undefined" && isWriteMode ) {
                            // the custom_tag is used for simulating the creation of a custom tagBox, to get the right width
                            var $custom_tagBox = ANT.aWindow.writeCustomTag( $tagsListContainer, $aWindow );
                                // $aWindow.removeClass('ant_rewritable');
                        }


                        // mode-specific addition functionality that needs to come AFTER writing the $aWindow to the DOM
                        if ( !isTouchBrowser) {
                            $aWindow.on( 'mouseleave.ant', function(e) {
                                var $this = $(this),
                                    timeoutCloseEvt;

                                timeoutCloseEvt = setTimeout(function(){
                                    if ( $this.hasClass('ant_rewritable') ) {
                                        $this.remove();
                                        if (!$('.ant_writemode').length) {
                                            $().selog('hilite', true, 'off');
                                        }
                                    }
                                },300);

                                $(this).data('timeoutCloseEvt', timeoutCloseEvt);
                            }).on('mouseenter.ant', function() {
                                var timeoutCloseEvt = $(this).data('timeoutCloseEvt');
                                clearTimeout(timeoutCloseEvt);
                            });
                            
                            //note: wrapped in !touchBrowser above
                            if ( typeof summary !="undefined" && summary.kind == "text" && !$.isEmptyObject( summary.content_nodes )) {
                                $aWindow.find('div.ant_box').each( function() {
                                    $(this).hover(
                                        function() {
                                            if ( typeof summary.content_nodes[$(this).find('div.ant_tag').data('content_node_id')] != 'undefined' ) {
                                                var selState = summary.content_nodes[$(this).find('div.ant_tag').data('content_node_id')].selState;
                                                //make sure it's not already transitiontion into a success state
                                                //hacky because sometimes it doesnt have the data for 1 yet
                                                var isPanelState1 = !$aWindow.data('panelState') || $aWindow.data('panelState') === 1;
                                                if( isPanelState1 ){
                                                    $().selog('hilite', selState, 'on');
                                                    $aWindow.data('selState', selState);
                                                }
                                            }
                                        },
                                        function() {
                                            if ( typeof summary.content_nodes[$(this).find('div.ant_tag').data('content_node_id')] != 'undefined' ) {
                                                var selState = summary.content_nodes[$(this).find('div.ant_tag').data('content_node_id')].selState;
                                                //make sure it's not already transitiontion into a success state
                                                //hacky because sometimes it doesnt have the data for 1 yet
                                                var isPanelState1 = !$aWindow.data('panelState') || $aWindow.data('panelState') === 1;
                                                if( isPanelState1 ){
                                                    $().selog('hilite', selState, 'off');                                        
                                                }
                                            }
                                        }
                                    );
                                });
                            }
                        
                        }

                        if(isPage){
                            
                        }

                        
//CHANGETHIS
// or delete this whole comment block
                        // $tagsListContainer.append($tag_table);
                        // ANT.aWindow.jspUpdate($aWindow);
                        // $aWindow.find('.ant_body_wrap').append($tagsListContainer);
                        // if ( reactionViewStyle == "grid" || isWriteMode ) {
                        //     // isotopeTags( $tagsListContainer );
                        //     // isotopeFillGap($tagsListContainer);
                        // } else {
                        //     // $tagsListContainer.find('.ant_box').addClass('ant_animated');
                        //     var tagBoxesCount = $tagsListContainer.find('div.ant_box').length,
                        //         currentTagBoxAnimating = 0;
                        //     // var animationQueue = setInterval( animateNextBox, 10 );
                        //     var animationQueue = setInterval( function() { animateNextBox(); }, 20 );

                        //     function animateNextBox() {
                        //         var $thisBox = $tagsListContainer.find('div.ant_box:eq('+currentTagBoxAnimating+')');
                        //         $thisBox.addClass('ant_animated');
                        //         currentTagBoxAnimating++;
                        //         if ( currentTagBoxAnimating > tagBoxesCount ) {
                        //             clearInterval( animationQueue );
                        //         }
                        //     }
                        // }

                        $tagsListContainer.jScrollPane({ showArrows:true });
                        // $aWindow.jScrollPane({ showArrows:true });
                        // ANT.aWindow.panelShow( $aWindow, $tagsListContainer, function() {});
                        return $tagsListContainer;

                        
                        // sort a list of tags into their buckets
                        // private function, but could be a ANT.util or ANT.tagBox function
                        function createTagBuckets( tagList ) {
                            function SortByTagCount(a,b) { return b.tag_count - a.tag_count; }

                            $.each( tagList, function(idx,tag){
                                if ( !tag.tag_count ) tag.tag_count = -101; 
                            }); // in write mode, all tags are "-101"

                            tagList.sort( SortByTagCount ); // each as a .body and a .tag_count
                            var buckets = {
                                big: [],
                                medium: [],
                                small: []
                            },
                            max = tagList[0].tag_count,
                            median = tagList[ Math.floor(tagList.length/2) ].tag_count,
                            min = tagList[ tagList.length-1 ].tag_count,
                            avg = (function(arr) { var total=0; $.each(arr, function(idx, tag) {total+= tag.tag_count }); return Math.floor(total/arr.length); })(tagList),
                            midValue = ( median > avg ) ? median:avg;

                            $.each( tagList, function(idx, tag) {
                                var tagBody = ( typeof tag.tag_body != "undefined" ) ? tag.tag_body:tag.body;
                                // if ( max > 15 && tag.tag_count >= (Math.floor( max*0.8 )) ) {
                                    // buckets.big.push( tag );
                                    // return;
                                // } else if ( tag.tag_count > midValue ) {
                                if ( tag.tag_count > midValue ) {
                                    buckets.big.push( tag );
                                    return;
                                } else {
                                    buckets.medium.push( tag );
                                    return;
                                }
                            });

                            return buckets;
                        }


                        //CHANGETHIS
                        // make this do rows, and otherwise not really bucket things
                        function writeTagBoxes( tagList ) {
                            if ( !tagList.length ) { return; }

                            var buckets = createTagBuckets( tagList ),
                                bucketTotal = buckets.big.length+buckets.medium.length+buckets.small.length,
                                rowNum = 0,
                                // bgColorInt = 0,
                                // textColorInt = 0,
                                numBgColors = ANT.group.tag_box_bg_colors.length;
                                // numTextColors = ANT.group.tag_box_text_colors.length;

                            // if a grid, size the aWindow based on # of reactions
                            if ( reactionViewStyle == 'grid') {
                                if ( bucketTotal > 6 && !isWriteMode ) {
                                    if(isTouchBrowser){
                                        ANT.aWindow.tagBox.setWidth( $aWindow, 222 );
                                    }else{
                                        ANT.aWindow.tagBox.setWidth( $aWindow, 222 );
                                    }
                                } else if ( typeof page != "undefined" && isWriteMode ) {
                                    ANT.aWindow.tagBox.setWidth( $aWindow, 222 );
                                } else if ( tagList.length > 1 ) {
                                    if ( buckets.big.length ) { ANT.aWindow.tagBox.setWidth( $aWindow, 222 ); }
                                    if ( buckets.medium.length ) { ANT.aWindow.tagBox.setWidth( $aWindow, 222 ); }
                                    if ( buckets.small.length >= 3 ) { ANT.aWindow.tagBox.setWidth( $aWindow, 222 ); }
                                }
                            }

                            var mediumBuckets = 0; // using this b/c i can't figure out some dumb iteration math with the rows.
                            while ( buckets.big.length || buckets.medium.length ) {
                                // get the background color and text color
                                // run a conversion in case its hex to convert to rgb.  since w'ell use rgba to set alpha to 0.85.
                                // var bgColorRGBA = '0,0,0,0.95';  // ANT.group.tag_box_bg_colors; //( ANT.util.hexToRgb( ANT.group.tag_box_bg_colors[rowNum] ) ) ? ANT.util.hexToRgb( ANT.group.tag_box_bg_colors[rowNum] ) : ANT.group.tag_box_bg_colors[rowNum];

                                                                
                                if ( buckets.big.length ) {
                                    var thisTag = buckets.big.shift();
                                    var $tagContainer = $('<div class="ant ant_tag_row row_num_'+rowNum+'"></div>');
                                    ANT.aWindow.tagBox.make( { tag: thisTag, boxSize: "big", $aWindow:$aWindow, $tagContainer:$tagContainer, isWriteMode:isWriteMode, rowNum:rowNum });
                                    
                                    $aWindow.find('div.ant_body.ant_tags_list').append($tagContainer);

                                    // set next color 
                                    rowNum++;
                                    if ( rowNum == numBgColors ) rowNum = 0;

                                    // bgColorInt++;
                                    // textColorInt++;
                                    // if ( bgColorInt == numBgColors ) bgColorInt = 0;
                                    // if ( textColorInt == numTextColors ) textColorInt = 0;

                                } else if ( buckets.medium.length ) {

                                    var thisTag = buckets.medium.shift();

                                    if (thisTag.body || thisTag.tag_body) {
                                        mediumBuckets++;
                                    
                                        var $tagRow = $aWindow.find('.ant_tag_row:last');

                                        if ( !$tagRow.length || $tagRow.find('.ant_box_big').length || $tagRow.children().length == 2 ) {
                                            var $tagContainer = $('<div class="ant ant_tag_row row_num_'+rowNum+'"></div>');
                                            $aWindow.find('div.ant_body.ant_tags_list').append($tagContainer);
                                            // rowNum++;
                                            // if ( rowNum == numBgColors ) rowNum = 0;
                                        } else {
                                            var $tagContainer = $tagRow;
                                        }

                                        ANT.aWindow.tagBox.make( { tag: thisTag, boxSize: "medium", $aWindow:$aWindow, $tagContainer:$tagContainer, isWriteMode:isWriteMode, rowNum:rowNum });
                                        
                                        // mediumBuckets++;
                                        if ( mediumBuckets % 2 === 0) { 
                                            rowNum++;
                                            if ( rowNum == numBgColors ) rowNum = 0;
                                        }
                                    }
                                    // set next color 
                                    
                                    // bgColorInt++;
                                    // textColorInt++;
                                    // if ( bgColorInt == numBgColors ) bgColorInt = 0;
                                    // if ( textColorInt == numTextColors ) textColorInt = 0;
    
                                // } else if ( buckets.small.length ) {
                                //   var thisTag = buckets.small.shift();
                                //   ANT.aWindow.tagBox.make( { tag: thisTag, boxSize: "small", $aWindow:$aWindow, isWriteMode:isWriteMode, textColorInt:textColorInt, bgColorInt:bgColorInt });
                                //   // set next color 
                                //   bgColorInt++;
                                //   textColorInt++;
                                //   if ( bgColorInt == numBgColors ) bgColorInt = 0;
                                //   if ( textColorInt == numTextColors ) textColorInt = 0;
                                }

                            }

                        } // writeTagBoxes


        
                    },
                    updateContainerTrackers: function(){
                        $.each( ANT.containers, function(idx, container) {
                            if ( container.kind && ( container.kind == "img" || container.kind == "media" || container.kind == "med") ) {
                                ANT.actions.indicators.utils.updateContainerTracker( container.hash );
                            }
                        });
                    },
                    updateContainerTracker: function(hash){
                        //ANT.actions.indicators.utils.updateContainerTracker:
                        var summary = ANT.summaries[hash],
                            $container = summary.$container,
                            $container_tracker = $('#ant_container_tracker_'+hash);


                        //quick fix so this doesnt get run on text.
                        //TODO figure out where this was getting called for text containers.
                        var container = ANT.containers[hash];
                        if ( container.kind && ( container.kind == "text" || container.kind == "txt") ) return;
                        

                        // check and see if the image or iframe are stil there
                        var $container_in_dom = $('[ant-hash="'+hash+'"]');
                        if ( !$container_in_dom.length ) {
                            $('#ant_indicator_details_'+hash).remove();
                            $('#ant_container_tracker_'+hash).remove();
                            return;
                        }

                        var padding = {
                            top: parseInt( $container.css('padding-top'), 10 ),
                            right: parseInt( $container.css('padding-right'), 10 ),
                            bottom: parseInt( $container.css('padding-bottom'), 10 ),
                            left: parseInt( $container.css('padding-left'), 10 )
                        };

                        var hasBorder = parseInt( $container.css('border-top-width'), 10 ) +
                            parseInt( $container.css('border-bottom-width'), 10 ) +
                            parseInt( $container.css('border-left-width'), 10 ) +
                            parseInt( $container.css('border-right-width'), 10 );

                        var paddingOffset = {};
                        paddingOffset.top = !hasBorder ? padding.top : 0;
                        paddingOffset.left = !hasBorder ? padding.left : 0;

                        // var containerWidth = $container.width() + 'px';
                        // var containerHeight = $container.height() + 'px';

                        //compensate for padding - which we want to ignore
                        // ANT.util.cssSuperImportant($container_tracker, {
                        //     // width: containerWidth,
                        //     // height: containerHeight,
                        //     top: $container.offset().top + paddingOffset.top+'px',
                        //     left: $container.offset().left + paddingOffset.left+'px'
                        // }, true);

                        this.updateMediaTracker(hash);

                    },
                    updateInlineIndicator: function(hash){
                        //ANT.actions.indicators.utils.updateInlineIndicator:
                        var summary = ANT.summaries[hash],
                            $container = summary.$container,
                            $indicator_details = summary.$indicator_details;

                        if (typeof $indicator_details != 'undefined') {
                            $indicator_details.css({
                               top: $container.offset().bottom,
                               left: $container.offset().left,
                               width:$container.outerWidth()
                            });
                        }
                    },
                    updateMediaTracker: function(hash){
                        //ANT.actions.indicators.utils.updateMediaTracker:
                        var summary = ANT.summaries[hash],
                            $container = summary.$container,
                            $indicator = summary.$indicator,
                            $indicator_body = summary.$indicator_body,
                            $indicator_details = summary.$indicator_details,
                            $container_tracker = $('#ant_container_tracker_'+hash);

                        if ( $indicator_body ) {
                            
                            if ( $container.parents( ANT.group.img_container_selectors ).length ) {
                                $container = $container.parents( ANT.group.img_container_selectors ).first();
                            }

                            //todo: consolodate this with the other case of it
                            var containerWidth, containerHeight;
                            var containerOffsets = $container.offset();

                            //this will calc to 0 if there is no border.
                            var hasBorder = parseInt( $container.css('border-top-width'), 10 ) +
                                parseInt( $container.css('border-bottom-width'), 10 ) +
                                parseInt( $container.css('border-left-width'), 10 ) +
                                parseInt( $container.css('border-right-width'), 10 );

                            if(hasBorder){
                                containerWidth = $container.outerWidth();
                                containerHeight = $container.outerHeight();
                            }else{
                                containerWidth = $container.width();
                                containerHeight = $container.height();
                            }

                            // not used currently
                            // var padding = {
                            //     top: parseInt( $container.css('padding-top'), 10 ),
                            //     right: parseInt( $container.css('padding-right'), 10 ),
                            //     bottom: parseInt( $container.css('padding-bottom'), 10 ),
                            //     left: parseInt( $container.css('padding-left'), 10 )
                            // };

                            // $indicator.offset({ top:containerOffsets.top+'px', left:containerOffsets.left+'px' });
                            // $indicator.width( containerWidth );
                            // $indicator.height( containerHeight );

                            var cornerPadding = 0,
                                indicatorBodyWidth = $indicator_body.width(),
                                modIEHeight = ( $.browser.msie && parseInt( $.browser.version, 10 ) < 9 ) ? 10:0,
                                modMediaSide = (summary.kind=="media") ? 12:0;

                            var cssTopOrBottom = (ANT.group.img_indicator_show_side.indexOf('top') != -1) ? 'top':'bottom';
                            if (cssTopOrBottom == 'top') {
                                var cssTop = containerOffsets.top + 3;
                            } else {
                                var cssTop = containerOffsets.top + ( (summary.kind=="media") ? (containerHeight + modIEHeight - 12 ) : (containerHeight + modIEHeight - 22) );
                            }

                            var cssSide = (ANT.group.img_indicator_show_side.indexOf('right') != -1) ? 'right':'left';
                            var cssSideDistance = (cssSide == 'left') ? (containerOffsets.left+modMediaSide) : ( $(window).width() - (containerOffsets.left+containerWidth-modMediaSide) );
                            var indicatorPosition = {};
                            indicatorPosition[cssSide] = cssSideDistance + 'px';
                            indicatorPosition['top'] = cssTop+'px';

                            ANT.util.cssSuperImportant( $indicator, indicatorPosition, true);

                            $indicator.data('top', cssTop);
                            if (summary.kind=="media") {
                                $indicator.addClass('ant_indicator_not_img');
                            }
                            var has_inline_indicator = (summary.kind=="text") ? false:true; //$container.data('inlineIndicator'); //boolean                        
                            if(has_inline_indicator){
                                ANT.actions.indicators.utils.updateInlineIndicator(hash);
                            }else{

                            }
                        }

                        // ANT.actions.indicators.utils.borderHilites.update(hash);
                    }
                }//end ANT.actions.indicators.utils
            },
            summaries:{
                init: function(hash){
                    if (!ANT.util.activeAB()) return;
                    //ANT.actions.summaries.init:

                    if ( typeof ANT.summaries[hash] == 'object' ) {
                        return ANT.summaries[hash];
                    }

                    //todo: it might make sense to just get this from the backend, since it has a function to do this already.

                    //data is in form {body:,kind:,hash:}
                    //todo: combine with above
                    var container = ANT.containers[hash];

                    //create an 'empty' summary object
                    var summary = {
                        "hash": hash,
                        "kind": container.kind,
                        "id": container.id,
                        "counts": {
                            "coms": 0,
                            "tags": 0,
                            "interactions": 0
                        },
                        "top_interactions": {
                            "coms": {},
                            "tags": {}
                        }
                    };
                    //dont save anymore

                    return summary;
                },
                save: function(summary){
                    //ANT.actions.summaries.save:
                    var hash = summary.hash;

                    //save the summary and add the $container as a property
                    ANT.summaries[hash] = summary;
                    summary.$container = $('[ant-hash="'+hash+'"]');

                    // ANT.actions.summaries.sortInteractions(hash);

                },
                update: function(hash, diff, isPage, pageId){
                    //ANT.actions.summaries.update:
                    /*
                    //EXAMPLE: diff object.  keep commented out, but leave it here.
                    var diff = {
                        coms: {
                            tagIdInt:{
                                body,
                                content_id,
                                id, //id is the comment id
                                social_user: {
                                    full_name,
                                    img_url,
                                    user //same as below
                                },
                                tag_id, //same int as the tagIdInt above
                                user: {
                                    first_name,
                                    id,
                                    last_name
                                }
                            }
                        },
                        tags: {
                            //this should be an obj: { 'id':{body:body, count:count, id:id} } where count should be 1 for add a new one, or -1 for remove it.
                            '2':{
                                'body':"Tag!!",
                                'delta':1, //this should always be 1 or -1.  Note there is no count attr, just the diff.
                                'id':id,
                                'parent_id':parent_id
                            }
                        }
                    }
                    */
                    if(isPage){
                        $.each( diff, function(interaction_node_type, nodes){
                            //will usually be just one interaction_node passed in, but can acoomodate a diff with many interaction_nodes
                            $.each(nodes, function(id,diffNode){
                                //coms or tags
                                //a bit hacky
                                diffNode.page_id = pageId;
                                ANT.actions.summaries.updatePageSummaryTags(hash, diffNode);
                            });
                        });
                        return;
                    }
                    //else, not a page

                    //get summary, or if it doesn't exist, get a zero'ed out template of one.

                    //todo: use a try catch instead;
                    var summary;
                    if( !ANT.summaries.hasOwnProperty(hash) ){
                        summary = ANT.actions.summaries.init(hash);
                    }else{
                        summary = ANT.summaries[hash];
                    }

                    //todo: not sure if this is being used. - no it's not being used yet.  never got to it.
                    // if( hash == "pageSummary" ){
                        //waaaiatt a minute... this isn't a hash.  Page level,...Ugly...todo: make not ugly
                        // summary = ANT.util.getPageProperty ('summary');
                    // }

                    $.each( diff, function(interaction_node_type, nodes){
                        // This is now scoped to node_type - so nodes, summary_nodes, and counts here only pertain to their category (tag or comment, etc.)
                        
                        //will usually be just one interaction_node passed in, but can acoomodate a diff with many interaction_nodes
                        $.each(nodes, function(id,diffNode){
                            //coms or tags
                            update_top_interactions_cache({
                                hash: hash,
                                summary: summary,
                                interaction_node_type: interaction_node_type,
                                id:id,
                                diffNode: diffNode
                            });

                            //this will only work for deletions right now.
                            // update_content_nodes_cache({
                            //     hash: hash,
                            //     summary: summary,
                            //     interaction_node_type: interaction_node_type,
                            //     id:id,
                            //     diffNode: diffNode
                            // });

                            //update the summary's counts object
                            summary.counts[interaction_node_type] += diffNode.delta;
                            summary.counts.interactions += diffNode.delta;

                            diffNode.int_type = interaction_node_type;
                            //now update aWindow
                            ANT.aWindow.update(hash, diffNode);

                        });

                    });

                    //don't forget to do this.  Tags won't get built correctly if not updated.
                    ANT.actions.summaries.sortInteractions(hash);
                    
                    // if( hash == "pageSummary" ){
                        //waaaiatt a minute... this isn't a hash.  Page level,...Ugly...todo: make not ugly
                        // makeSummaryWidget(ANT.page);
                    // }else{
                        //only init if it's a text node, don't do it for media.
                        // var shouldReInit = (summary.kind == 'text');
                        // ANT.actions.indicators.update( hash, shouldReInit );
                    // }
                                
                    function update_top_interactions_cache(attrs){
                        //CHANGETHIS?
                        // delete?
                        var hash = attrs.hash;
                        var summary = attrs.summary;
                        var interaction_node_type = attrs.interaction_node_type;
                        var id = attrs.id;
                        var diffNode = attrs.diffNode;
                        
                        var summary_nodes = summary.top_interactions[interaction_node_type];
                        var interactionExists = ( summary_nodes.hasOwnProperty(id) && typeof summary_nodes[id] !== 'undefined');
                        if( interactionExists ){
                            var summary_node = summary_nodes[id];

                            //note that for coms this just covers the case where it exists and we delete it.
                            summary_node.count += diffNode.delta;

                            if(interaction_node_type == "tags"){
                                //also update page
                                ANT.actions.summaries.updatePageSummaryTags(hash, diffNode);
                                
                                //if this cleared out the last of this node, delete it. (i.e. if a first-ever tag was made, and then undone )
                                if( summary_node.count <= 0 ){
                                    delete summary_nodes[id]; //don't try to use summary_node here instead of summary_nodes[id].
                                }
                            }


                        }else{
                            //interaction doens't exist yet:
                            //split between tags and comments:
                            if(interaction_node_type == "tags"){
                                //todo: implement a diffNode.make function instead of this.
                                summary_nodes[id] = {
                                    count: diffNode.delta, //this should always be 1.
                                    body: diffNode.body,
                                    id: id,
                                    parent_id: diffNode.parent_id,
                                    parent_interaction_node: diffNode.parent_interaction_node
                                };

                                //also update page
                                ANT.actions.summaries.updatePageSummaryTags(hash, diffNode);

                            }else{

                                var user = diffNode.user;

                                summary_nodes[diffNode.tag_id] = {
                                    //I don't think it makes sense to save a count, because unlike tags, each comment should be unique
                                    //count: diffNode.delta, //this should always be 1.
                                    body: diffNode.body,
                                    content_node: diffNode.content_node,
                                    content_id: diffNode.content_id,
                                    id: diffNode.id,
                                    social_user: diffNode.social_user,
                                    tag_id: diffNode.tag_id,
                                    user: diffNode.user,
                                    parent_id: diffNode.parent_id,
                                    parent_interaction_node: diffNode.parent_interaction_node
                                };
                            }

                        }
                    }

                    function update_content_nodes_cache(attrs){

                        //CHANGETHIS?
                        // delete?
                        //todo: this is still not 100% right - but updates better than not having it at all.
                        //need to solve for the fact that we don't have the content_node id when we first make it.

                        //todo this function sucks
                        return; 
                        //we cant do this yet..
                        var hash = attrs.hash;
                        var summary = attrs.summary;
                        var interaction_node_type = attrs.interaction_node_type;
                        var id = attrs.id;
                        var diffNode = attrs.diffNode;
                        
                        //hmm, we don't always have this yet.
                        var content_nodes = summary.content_nodes;
                        if(!content_nodes){
                            return;
                        }
                        $.each(content_nodes, function(id,content_node){
                            //todo: this isn't 100% correct - should use an id, but we don't always have it.
                            if(interaction_node_type == "tags"){
                                //damn it we dont have this.
                                if(id === diffNode.content_id){
                                    //then consider this the correct node.

                                    content_node.counts[interaction_node_type] += diffNode.delta;
                                    content_node.counts[interactions] += diffNode.delta;

                                    var tagId = diffNode.id;
                                    var tagRecordInContentNode = content_node.top_interactions.tags[tagId];
                                    if(tagRecordInContentNode){
                                        tagRecordInContentNode.count += diffNode.delta;
                                        if(tagRecordInContentNode.count <= 0){
                                            delete content_node.top_interactions.tags[tagId];
                                        }
                                    }

                                }
                            }else if(interaction_node_type == "coms"){

                                //todo - in progress...
                                if(content_node.id === diffNode.content_id){

                                    content_node.counts[interaction_node_type] += diffNode.delta;
                                    content_node.counts[interactions] += diffNode.delta;

                                    var contentNodeComs = content_node.top_interactions.coms;

                                    //remove if deletion
                                    if( diffNode.delta === -1){
                                        $.each(contentNodeComs, function(idx, comNode){
                                            //ugg, we dont have enough data to do this.
                                        })

                                    }else{
                                           
                                    }
                                }
                            }

                        });
                    }

                },
                updatePageSummaryTags: function(hash, diffNode){
                    //ANT.actions.summaries.updatePageSummaryTags:

                        //also update page
                        var tagId = diffNode.id;
                        var pageId = diffNode.page_id || ANT.util.getPageProperty('id', hash);
                        var page = ANT.pages[pageId];
                        var toptags = page.toptags;
                        
                        var foundIt;

                        //update the tag count for this tag
                        $.each(toptags, function(){
                            if(this.id == tagId){
                                page.count += diffNode.delta;
                                this.tag_count += diffNode.delta;

                                //no need to remove 0 counts, it seems to just work.
                                foundIt = true;
                            }
                        });

                        if(!foundIt){
                            //add to topTags
                            toptags.push({
                                body:diffNode.body,
                                id:diffNode.id,
                                tag_count:1 //will always be 1
                            });
                        }

                        //add to page tag count
                        //This sucks - fix our summary later.
                        var summary = page.summary;
                        $.each( summary, function(idx, val){
                            if(val.kind == "tag"){
                                val.count = val.count + diffNode.delta;
                            }
                        });


                        var $page = $('[ant-page-container="'+pageId+'"]'); 
                        //update plugin widgets
                        //update antWidgetSummary...
                        var $summaryWidgetAnchorNode = $page.find('[ant-page-widget-key]');
                        $summaryWidgetAnchorNode.antWidgetSummary('update');
                    
                },

                sortByTags: function(tags) {
                  // ANT.actions.summaries.sortByTags
                  
                  //redundant with below.  
                  //I need to use this for page summaries and dont want to mess with the below func.
                  function SortByTagCount(a,b) { return b.tag_count - a.tag_count; }
                  return tags.sort( SortByTagCount );
                },

                sortInteractions: function(hash) {
                    // ANT.actions.summaries.sortInteractions
                    function SortByTagCount(a,b) { return b.tag_count - a.tag_count; }

                    var summary = ANT.summaries[hash];
                    summary.interaction_order = [];
                    summary.counts.highest_tag_count = 0;

                    if ($.isEmptyObject( summary.content_nodes ) && !$.isEmptyObject( ANT.content_nodes[hash]) ) {
                        ANT.actions.content_nodes.init( hash );
                    }

                    var isText = summary.kind == "text" || summary.kind == "txt";
                    //eric: This seems to be unncessary and bug-causing for non-text nodes.  adding a conditional for text
                    if ( isText ) {
                        // text requires iterating through the possible content nodes
                        // has a freaking content node obj?  i.e. is text that can be arbitrarily selected?
                        if (!$.isEmptyObject( summary.content_nodes )) {
                            $.each( summary.content_nodes, function( node_id, node_data ) {
                                $.each( node_data.top_interactions.tags, function( tag_id, tag_data ) {
                                    summary.interaction_order.push( { tag_count:tag_data.count, tag_id:tag_id, tag_body:tag_data.body, content_node_id:node_id, parent_id:tag_data.parent_id } );
                                    setHighestTagCount(tag_data.count);
                                });
                            });
                        // has no content node obj?  i.e. is text that is probably a ant-item.
                        } else {
                            $.each( summary.top_interactions.tags, function( tag_id, tag_data ) {
                                summary.interaction_order.push( { tag_count:tag_data.count, tag_id:tag_id, tag_body:tag_data.body, content_node_id:node_id, parent_id:tag_data.parent_id } );
                                setHighestTagCount(tag_data.count);
                            });
                        }
                    } else if ( !$.isEmptyObject( summary.top_interactions ) && !$.isEmptyObject( summary.content_nodes) ) {
                        // images+media are their own content nodes (for now.  video will split out later.)
                        var node_id = $.map( summary.content_nodes, function(value, key) {return key;})[0];
                        $.each( summary.top_interactions.tags, function( tag_id, tag_data ) {
                            summary.interaction_order.push( { tag_count:tag_data.count, tag_id:tag_id, tag_body:tag_data.body, content_node_id:node_id, parent_id:tag_data.parent_id } );
                            setHighestTagCount(tag_data.count);
                        });
                    }
                    summary.interaction_order.sort( SortByTagCount );

                    function setHighestTagCount(tag_count) {
                        if (tag_count > summary.counts.highest_tag_count ) {
                            summary.counts.highest_tag_count = tag_count;
                        }
                    }
                    
                },
                sortPopularTextContainers: function() {
                    // ANT.actions.summaries.sortPopularTextContainers
                    // only sort the most popular whitelisted
                    // is this used??
                    function SortByCount(a,b) { return b.interactions - a.interactions; }

                    ANT.text_container_popularity = [];
                    $.each( ANT.summaries, function( hash, container ){
                        if ( container.kind == "text" && container.counts.interactions > 0 ) {
                            ANT.text_container_popularity.push( { hash:hash, interactions:container.counts.interactions } );
                        }
                    });

                    ANT.text_container_popularity.sort( SortByCount );

                },
                displayPopularIndicators: function () {
                    // ANT.actions.summaries.displayPopularIndicators
                    // is this used??
                    for ( var i=0; i < ANT.group.initial_pin_limit; i++) {
                        if ( ANT.text_container_popularity[i] ) $('#ant_indicator_' + ANT.text_container_popularity[i].hash).removeClass('ant_dont_show');
                    }
                },
                showLessPopularIndicators: function() {
                    // ANT.actions.summaries.showLessPopularIndicators
                    // is this used??
                    var hashesToShow = [];

                    if (typeof ANT.text_container_popularity != 'undefined') {
                        for ( var i=ANT.group.initial_pin_limit; i<ANT.text_container_popularity.length; i++) {
                            if ( ANT.text_container_popularity[i] ) {
                                if ( ANT.text_container_popularity[i].interactions > 0 ) {
                                    $('#ant_indicator_' + ANT.text_container_popularity[i].hash).removeClass('ant_dont_show');
                                    hashesToShow.push( ANT.text_container_popularity[i].hash );
                                }
                            }
                        }
                    }

                    ANT.actions.indicators.show(hashesToShow);
                }
            },
            insertContainerIcon: function( hash ) {},
            viewReactionSuccess: function(args) {
                //ANT.actions.viewReactionSuccess

                var tag = args.tag,
                    $aWindow = args.aWindow,
                    interaction = args.response.data.interaction,
                    content_node = ( args.content_node == "" ) ? args.response.data.content_node:args.content_node;

                $aWindow.removeClass('ant_rewritable').addClass('ant_viewing_more').find('.ant_footer').hide();
                //temp tie-over
                var headerText = ( args.scenario == "reactionSuccess" ) ? ANT.t('thanks') : ANT.t('already_done_that');

                var isPage = args.kind == "page";
                if(isPage){
                    var hash = null,
                        kind = "page";
                }else{
                    var hash = args.hash,
                        summary = ANT.summaries[hash],
                        kind = summary.kind; // text, img, media
                }


                // do stuff, populate the aWindow.
                var $header = ANT.aWindow.makeHeader( headerText, args.response.data.interaction.id);
                $aWindow.find('.ant_header').replaceWith($header);

                var $newPanel = ANT.aWindow.panelCreate( $aWindow, 'ant_view_more' );
                var $ant_body_wrap = $aWindow.find('div.ant_body_wrap');
                $ant_body_wrap.append( $newPanel );

                ANT.aWindow.updateTagMessage( args );

                // var isMediaContainer = kind=="img" ||
                //     kind=="image" ||  // [pb] really?
                //     kind=="imgage" ||
                //     kind=="med" ||
                //     kind=="media";

                ANT.aWindow.panelShow( $aWindow, $newPanel, function() {
                  
                    if ( kind == "text" && args.selState ){
                        var selState = args.selState;
                        $().selog('hilite', selState, 'on');
                    }

                    var $tagsListContainer = ANT.actions.indicators.utils.makeTagsListForInline( $aWindow );
                    
                    // for crossPageHashes only - will do nothing if it's not a crosspagehash
                    if (args.scenario != "reactionExists") {
                        ANT.actions.containers.updateCrossPageHash(hash);
                    }

                    $tagsListContainer.addClass('ant_hiddenPanel');
                    var className = "ant_tags_list";
                    ANT.aWindow.hideFooter($aWindow);
                    ANT.aWindow.panelUpdate($aWindow, className, $tagsListContainer);
                    
                    var isCrossPageContainer = $('[ant-hash="'+hash+'"]').length > 0;
                    // if(!isCrossPageContainer){
                        //dont do this for crossPageContainers - it was messing shit up.
                    // }

                } );
                
                //todo: examine resize
                // ANT.aWindow.updateSizes( $aWindow );

                // ANT.events.track( 'view_reaction_success::'+interaction.id+'|'+tag.id, hash );
            },
            viewCommentContent: function(args){
                //ANT.actions.viewCommentContent
                var tag = args.tag,
                    $aWindow = args.aWindow,
                    content_node = args.content_node;

                ANT.events.trackEventToCloud({
                    event_type: "vcom",
                    event_value: '',
                    container_hash: args.hash,
                    container_kind: args.content_node.kind,
                    page_id: ANT.util.getPageProperty('id'),
                    reaction_body: args.tag.tag_body
                });

                $aWindow.removeClass('ant_rewritable').addClass('ant_viewing_more');
                ANT.aWindow.tagBox.setWidth( $aWindow, 222 );
                ANT.aWindow.hideFooter( $aWindow );

                //temp tie-over
                var hash = args.hash,
                    summary = ANT.summaries[hash],
                    tagBody = (tag.tag_body) ? tag.tag_body:tag.body,
                    kind = summary.kind; // text, img, media

                // do stuff, populate the aWindow.
                var $header = ANT.aWindow.makeHeader( tag.tag_body );
                $aWindow.find('.ant_header').replaceWith($header);

                var $newPanel = ANT.aWindow.panelCreate( $aWindow, 'ant_view_more' );
                var $ant_body_wrap = $aWindow.find('div.ant_body_wrap');
                $ant_body_wrap.append( $newPanel );


                var $commentsWrap = $('<div class="ant_commentsWrap"></div>');
                var $backButton = _makeBackButton();
                var $backButton2 = _makeBackButton();
                var $otherComments = _makeOtherComments();
                var $commentBox = _makeCommentBox();
                $commentsWrap.append($backButton, $otherComments, $commentBox );

                $newPanel.append($commentsWrap);

                var isMediaContainer = kind=="img" ||
                    kind=="imgage" ||
                    kind=="med" ||
                    kind=="media";

                //todo: examine resize
                // ANT.aWindow.updateSizes( $aWindow );
                ANT.aWindow.panelShow( $aWindow, $newPanel, function() {
                    if ( kind == "text" ){
                        var selState = args.selState || summary.content_nodes[ content_node.id ].selState;
                        $().selog('hilite', selState, 'on');
                        $aWindow.data('selState', selState);
                    }
                });

                // ANT.events.track( 'view_comment::'+content_node.id+'|'+tag.id, hash );

                //helper functions
                function _makeCommentBox() {

                    // no t()
                    var $commentBox = $('<div class="ant_commentBox ant_innerWrap"></div>').html(
                        '<div class="ant_commentComplete"><div><h4>Leave a comment:</h4></div></div>'
                    );
                   //todo: combine this with the other make comments code
                    var helpText = "Add a comment or #hashtag",
                        $commentDiv =  $('<div class="ant_comment ant_clearfix">'),
                        $commentTextarea = $('<textarea class="commentTextArea ant_default_msg">' +helpText+ '</textarea>'),
                        // $ant_charCount =  $('<div class="ant_charCount">'+ANT.group.comment_length+' characters left</div>'),
                        $ant_charCount =  $('<div class="ant_charCount">' + ANT.t('characters_left').replace('NNN', ANT.group.comment_length ) +'</div>'),
                        $submitButton =  $('<button class="ant_commentSubmit">'+ANT.t('comment')+'</button>');

                    $commentDiv.append( $commentTextarea, $ant_charCount, $submitButton );

                    $commentTextarea.focus(function(){
                        // ANT.events.track('start_comment_lg::'+content_node.id+'|'+tag.id);
                        if( $(this).val() == helpText ){
                            $(this).val('');
                        }

                    // todo: consolodate with similar functions.
                    }).blur(function(){
                        var val = $(this).val();
                        if( val === "" || val === helpText ){
                            $(this).addClass('ant_default_msg');
                            $(this).val( helpText );
                        }
                    }).keyup(function(event) {
                        var commentText = $commentTextarea.val();
                        if (event.keyCode == '27') { //esc
                            $(this).blur();
                            // return false so the aWindow doesn't close.
                            return false;
                        } else if ( commentText.length > ANT.group.comment_length ) {
                            commentText = commentText.substr(0, ANT.group.comment_length);
                            $commentTextarea.val( commentText );
                        }
                        // $commentTextarea.siblings('div.ant_charCount').text( ( ANT.group.comment_length - commentText.length ) + " characters left" );
                        $commentTextarea.siblings('div.ant_charCount').text( ANT.t('characters_left').replace('NNN', ( ANT.group.comment_length - commentText.length ) ) );
                    });

                    $submitButton.click(function(e) {
                        var commentText = $commentTextarea.val();
                        //keyup doesn't guarentee this, so check again (they could paste in for example);
                        if ( commentText.length > ANT.group.comment_length ) {
                            commentText = commentText.substr(0, ANT.group.comment_length);
                            $commentTextarea.val( commentText );
                            // $commentTextarea.siblings('div.ant_charCount').text( ( ANT.group.comment_length - commentText.length ) + " characters left" );
                            $commentTextarea.siblings('div.ant_charCount').text( ANT.t('characters_left').replace('NNN', ( ANT.group.comment_length - commentText.length ) ) );
                        }

                        if ( commentText != helpText ) {
                            //temp translations..
                            //quick fix.  images don't get the data all passed through to here correctly.
                            //could try to really fix, but hey.  we're rewriting soon, so using this hack for now.

                            if ($.isEmptyObject(content_node) && summary.kind=="img") {
                                content_node = {
                                    "body":$('img[ant-hash="'+summary.hash+'"]').get(0).src,
                                    "kind":summary.kind,
                                    "hash":summary.hash
                                };
                            } else {
                                // more kludginess.  how did this sometimes get set to "txt" and sometimes "text"
                                // see if this is a custom display type
                                // if so, use that info to set the kind
                                // i know, this looks bad, is duplicated elsewhere, and looks overlappng with the code in the if() right above
                                var $node = $('[ant-hash="'+summary.hash+'"]'),
                                    content_type = $node.attr('ant-content-type');

                                if ( content_type ) {
                                    if (content_type == "media") { content_node.kind = "media"; }
                                    else if (content_type == "image") { content_node.kind = "image"; }
                                    else { content_node.kind = "text"; }
                                } else {
                                    content_node.kind = "text";
                                }
                            }
                            var selState = selState || null;
                            var args = {  hash:hash, content_node_data:content_node, comment:commentText, content:content_node.body, tag:tag, aWindow:$aWindow, selState:selState};

                            //leave parent_id undefined for now - backend will find it.
                            ANT.actions.interactions.ajax( args, 'comment', 'create');

                        } else{
                            $commentTextarea.focus();
                        }
                        return false; //so the page won't reload
                    });

                    // return $commentBox.append( $commentDiv );
                    $commentBox.append( $commentDiv )
                    return $commentBox;
                }

                function _makeBackButton(){
                    var $backButton = $('<div class="ant_back">'+ANT.t('close')+' X</div>');
                    $backButton.click( function() {
    
                        //temp fix because the aWindow scrollpane re-init isnt working
                        // var isViewForAWindow = !!$aWindow.attr('ant-view-reactions-for');
                        // if(!isViewForAWindow){
                            // ANT.aWindow.close($aWindow);
                            // return;
                        // }

                        // var $header = ANT.aWindow.makeHeader( ANT.t('reactions') );
                        // $aWindow.find('.ant_header').replaceWith($header)
                        // ANT.aWindow.updateTagPanel( $aWindow );
                        ANT.aWindow.safeClose( $aWindow );
                    });
                    return $backButton;
                }

                function _makeOtherComments(){
                    var comments,
                        tagId = ( tag.id ) ? tag.id:tag.tag_id;
                    // () ? text_node : image_node
                    if ( kind == "text" ) {
                        comments = summary.content_nodes[ content_node.id ].top_interactions.coms;
                    } else {
                        comments = summary.top_interactions.coms[tagId];
                    }

                    var node_comments = 0;

                    //todo: fix nasty dirty hack
                    if( !$.isArray(comments) ){
                        comments = [].push(comments);
                    }

                    $.each(comments, function(idx, com){
                         if ( com.tag_id == tagId ) {
                            node_comments++;
                        }
                    });

                    var hasComments = !$.isEmptyObject(comments);
                    if(!hasComments) return;
                    //else

                    // ok, get the content associated with this tag!
                    var $otherComments = $('<div class="ant_otherCommentsBox"></div>');
                    var $header = $('<div class="ant_comment_header ant_innerWrap"><h4>(<span>' + node_comments + '</span>) '+ANT.t('comments')+':</h4></div>');
                    $otherComments.append($header);

                    $.each(comments, function(idx, this_comment){
                        if( this_comment.tag_id != tagId ){
                            return;
                        }

                        $otherComments.show();

                        var $commentSet = $('<div class="ant_commentSet ant_innerWrap" />'),
                            $commentBy = $('<div class="ant_commentBy" />'),
                            $comment = $('<div class="ant_comment" />'),
                            $commentReplies = $('<div class="ant_commentReplies" />'),
                            $commentReply = $('<div class="ant_commentReply" />'),
                            $commentReply_link = $('<a href="javascript:void(0);">Reply</a>');

                        var user_image_url = ( this_comment && this_comment.social_user && this_comment.social_user.img_url ) ? this_comment.social_user.img_url: ANT_staticUrl+'widget/images/anonymousplode.png';

                        var user_name = ( !this_comment || !this_comment.user || this_comment.user.first_name === "" ) ? 
                            "Anonymous" : 
                            this_comment.user.first_name + " " + this_comment.user.last_name;
                        
                        $commentBy.html(
                            '<a href="'+ANT_baseUrl+'/user/'+this_comment.user.id+'" target="_blank"><img src="'+user_image_url+'" class="no-ant" /> ' + user_name + '</a>'
                        ).click( function() {
                            // ANT.events.track('click_user_profile');
                        });

                        $comment.html(
                            '<div class="ant_comment_body">'+this_comment.body+'</div>'
                        );

                        $commentSet.append( $commentBy, $comment ); // , $commentReplies, $commentReply
                        $otherComments.append( $commentSet );

                    });

                    $otherComments.find('div.ant_commentSet:last-child').addClass('ant_lastchild');
                    return $otherComments;

                } //end makeOtherComments
            },
            share_getLink: function(args) {
                var hash = args.hash,
                    summary = ANT.summaries[hash],
                    kind = (args.kind) ? args.kind:summary.kind;

                //example:
                //tag:{body, id}, aWindow:aWindow, settings:settings, callback:

                // tag can be an ID or a string.  if a string, we need to sanitize.

                // tag, aWindow, settings, callback

                // TODO the args & params thing here is confusing
                ANT.session.getUser( args, function( params ) {
                    // get the text that was highlighted

                    // var content = $.trim( params.settings.content ),
                    //     container = $.trim( params.settings.container ),
                    //     src_with_path = $.trim( params.settings.src_with_path );

                    var aWindow = params.aWindow,
                        tag = params.tag;
                    
                    var content_node_info = (params.content_node_info) ? params.content_node_info:params.content_node;

                    // translations.  TODO clean and remove
                    if ( !content_node_info.hash ) content_node_info.hash = ( content_node_info.container ) ? content_node_info.container:params.hash;
                    if ( !content_node_info.content ) content_node_info.content = content_node_info.body;

                    //patching in reliable info todo: redo this formating

                    var content_node_data = {
                        'hash': hash,
                        'body': content_node_info.content,
                        'location': content_node_info.location,
                        'kind':kind
                    };

                    var content_node = ANT.actions.content_nodes.make(content_node_data);

                    // TODO SHARE HACK REMOVE THIS DAILYCANDY ONLY
                    // if ( window.location.hash.length > 1 ) {
                        $.postMessage(
                            "page_hash|"+window.location.hash,
                            ANT_baseUrl + "/static/xdm.html",
                            window.frames['ant-xdm-hidden']
                        );
                    // }

                    if ( typeof tag.body == "undefined" ) {
                        tag.body = tag.tag_body;
                    }
                    var sendData = {
                        "tag" : tag,
                        "hash": content_node_data.hash,
                        "content_node_data" : content_node_data,
                        "user_id" : ANT.user.user_id,
                        "ant_token" : ANT.user.ant_token,
                        "group_id" : ANT.group.id,
                        "page_id" : ANT.util.getPageProperty('id', hash),
                        "referring_int_id" : args.referring_int_id,
                        "container_kind" : (args.kind=="page") ? "page":ANT.summaries[hash].kind  // TODO: a container kind of page should be handled better
                    };

                        // send the data!
                        $.ajax({
                            url: ANT_baseUrl+"/api/share/",
                            type: "get",
                            contentType: "application/json",
                            dataType: "jsonp",
                            data: { json: $.toJSON(sendData) },
                            success: function(response) {
                                // todo cache the short url
                                // ANT.summaries[content_node_info.hash].content_nodes[IDX].top_interactions.tags[tag.id].short_url = ;
                                args.response = response;

                                if ( response.status == "fail" ) {
                                    if ( response.message.indexOf( "Temporary user interaction limit reached" ) != -1 ) {
                                        ANT.session.showLoginPanel( args );
                                    } else {
                                        // if it failed, see if we can fix it, and if so, try this function one more time
                                        ANT.session.handleGetUserFail( args, function() {
                                            ANT.actions.share_getLink( args );
                                        });
                                    }
                                } else {
                                    //successfully got a short URL

                                    ANT.actions.shareContent({
                                        sns: params.sns,
                                        content_node_info: content_node_info,
                                        short_url: response.data.short_url,
                                        reaction: tag.body,
                                        //the content_node_info kind was un-reliable. - use this instead
                                        container_kind: (hash == "page") ? "page" : ANT.summaries[hash].kind
                                    });
                                }
                            },
                            error: function(response) {
                                //for now, ignore error and carry on with mockup
                            }
                        });
                });
            },
            shareContent: function(args) {
                var groupName = _getGroupName();

                var content = args.content_node_info.content,
                    share_url = "",
                    contentStr = "",
                    content_length = 300;

                switch (args.sns) {
                    case "facebook":
                        var imageQueryP = "";
                        var videoQueryP = ""; //cant get one of these to work yet without overwriting the rest of the stuff
                        var mainShareText = "";
                        // no t()
                        var footerShareText = "Antenna Reaction on " + groupName;

                        switch ( args.container_kind ) {
                            case "txt":
                            case "text":
                                content_length = 300;
                                contentStr = _shortenContentIfNeeded(content, content_length, true);
                                mainShareText = _wrapTag(args.reaction) +" "+ contentStr;
                            break;

                            case "img":
                            case "image":
                                contentStr = "[a picture on "+groupName+"] Check it out: ";

                                //for testing offline
                                if(ANT_offline){
                                    content = content.replace("local.antenna.is:8081", "www.antenna.is");
                                    content = content.replace("local-static.antenna.is:8081", "www.antenna.is");
                                }
                                
                                imageQueryP = '&p[images][0]='+encodeURI(content);
                                mainShareText = _wrapTag(args.reaction) +" "+ contentStr;
                            break;

                            case "media":
                            case "med":
                            case "video":
                                contentStr = "[a video on "+groupName+"] Check it out: ";
                                mainShareText = _wrapTag(args.reaction) +" "+ contentStr;
                            break;

                            case "page":
                                contentStr = "[an article on "+groupName+"] Check it out: ";
                                mainShareText = _wrapTag(args.reaction) +" "+ contentStr;
                            break;
                        }

                        share_url = 'http://www.facebook.com/sharer.php?s=100' +
                                        '&p[title]='+encodeURI( mainShareText )+
                                        '&p[url]='+args.short_url+
                                        '&p[summary]='+encodeURI(mainShareText)+
                                        //these will just be "" if not relevant
                                        imageQueryP+
                                        videoQueryP;

                    //&p[images][0]=<?php echo $image;?>', 'sharer',
                    //window.open('http://www.facebook.com/sharer.php?s=100&amp;p[title]=<?php echo $title;?>&amp;p[summary]=<?php echo $summary;?>&amp;p[url]=<?php echo $url; ?>&amp;&p[images][0]=<?php echo $image;?>', 'sharer', 'toolbar=0,status=0,width=626,height=436');
                    break;

                    case "twitter":
                        
                        var mainShareText = "";
                        var footerShareText = "Antenna Reaction on " + groupName;
                        var twitter_acct = ( ANT.group.twitter ) ? '&via='+ANT.group.twitter : '';

                        switch ( args.container_kind ) {
                            case "txt":
                            case "text":
                                content_length = ( 110 - args.reaction.length );
                                contentStr = _shortenContentIfNeeded(content, content_length, true);
                                mainShareText = _wrapTag(args.reaction) +" "+ contentStr;
                            break;

                            case "img":
                            case "image":
                                contentStr = "[a picture on "+groupName+"] Check it out: ";
                                mainShareText = _wrapTag(args.reaction) +" "+ contentStr;
                            break;

                            case "media":
                            case "med":
                            case "video":
                                contentStr = "[a video on "+groupName+"] Check it out: ";
                                mainShareText = _wrapTag(args.reaction) +" "+ contentStr;
                            break;

                            case "page":
                                contentStr = "[an article on "+groupName+"] Check it out: ";
                                mainShareText = _wrapTag(args.reaction) +" "+ contentStr;
                            break;
                        }

                        share_url = 'http://twitter.com/intent/tweet?'+
                                'url='+args.short_url+
                                twitter_acct+
                                '&text='+encodeURI(mainShareText);
                    break;

                }
                if ( share_url !== "" ) {
                    if ( ANT.shareWindow ) {
                        ANT.shareWindow.location = share_url;
                    }
                }else{
                    if ( ANT.shareWindow ) {
                        ANT.shareWindow.close();
                    }
                }

                function _getGroupName(){
                    //consider using ANT.group.name
                    //todo: make this smarter - check for www. only in start of domain
                    return ANT.group.name ?
                        ANT.group.name :
                        (document.domain).replace('www.', "");
                }
                
                function _wrapTag(tag, doHTMLEscape, isActionNotContent){
                    
                    var connectorSign = isActionNotContent ?
                            //use pipe
                            doHTMLEscape ? 
                                "&#124;" :
                                "|"
                        :
                            //use >>
                            doHTMLEscape ? 
                                "&raquo;" :
                                "»"
                        ;


                    return doHTMLEscape ?
                        tag + "&nbsp;"+connectorSign+"&nbsp;" : //[ tag ]  >>
                        tag + " "+connectorSign;
                }

                function _shortenContentIfNeeded(content, content_length, addQuotes){
                    var ext = '...';
                    var safeLength = content_length - ext.length;
                    var str = ( content.length <= content_length ) ?
                        content :
                        content.substr(0, safeLength) + ext;
                    str = addQuotes ? ( '"' + str + '"' ) : str;
                    return str;
                }

            },
            newUpdateData: function(hash){
                //ANT.actions.newUpdateData:
                //not using this yet...
                var summary = ANT.summaries[hash],
                    $aWindow_readmode = summary.$aWindow_readmode,
                    $aWindow_writemode = summary.$aWindow_writemode;
            },
            startSelect: function($mouse_target, mouseEvent, callback) {
                //ANT.actions.startSelect:
                // make a jQuery object of the node the user clicked on (at point of mouse up)

                // if this is a node with its own, separate call-to-action, don't do a custom new selection.
                if ( $mouse_target.hasAttr('ant-item') && $('[ant-cta-for="'+$mouse_target.attr('ant-item')+'"]').length ) { 
                    return; 
                }

                //destroy all other actionbars
                ANT.actionbar.closeAll();
                var maxChars = 800;

                // make sure it's not selecting inside the ANT windows.
                // todo: (the ant_indicator is an expection.
                // The way we're dealing with this is a little weird.  It works, but could be cleaner)
                if ( $mouse_target.closest('.ant, .no-ant, #ant_sandbox').length && !$mouse_target.closest('.ant_indicator').length ) return;
                //else

                var $blockParent = null;
                if( _isValid($mouse_target) ) {
                    // the node initially clicked on is the first block level container
                    $blockParent = $mouse_target;
                } else {
                    $blockParent = findNearestValidParent($mouse_target);
                }

                //if no valid blockParent was found, we're done here.
                if( $blockParent === null ) return;
                //else

                $antParent = $blockParent.closest('[ant-hashed]');
            
                //let selog use serialrange to check if the selected text is contained in the $blockParent (also check for "" of just whitespace)
                var selected = $blockParent.selog('save');
                if ( !selected || !selected.serialRange || !selected.text || (/^\s*$/g.test(selected.text)) ) return;
                //else

                //don't send text that's too long - mostly so that the ajax won't choke.
                if(selected.text.length > maxChars) return;

                var kind = 'text';
                var content = selected.text;

                // check if the blockparent is already hashed
                if ( $antParent.length && $antParent.hasAttr('ant-hashed') && !$antParent.hasAttr('ant-page-container') ) {
                    if(callback){
                        var hash = $antParent.data('hash')
                        callback(hash, kind, content);
                        return;
                    }
                    return _drawActionBar($antParent);
                }
                else{
                    //hasn't been hashed yet.
                    //try to submit node to server.  Draw the actionbar using an onsuccess function so we don't draw it if it fails.
                    //note: hashes in this case will just be a single hash. That's cool.
                    
                    //todo: use our new sendHashesForSinglePage function after testing and refactoring.
                    var hashListForPage = ANT.actions.hashNodes( $blockParent );

                    if(hashListForPage){
                        ANT.actions.sendHashes( hashListForPage, function(){
                            if(callback){
                                //god this re-var-ing of hash is awful, rewrite later.
                                var hash = $blockParent.data('hash');
                                callback(hash, kind, content);
                                return;
                            }
                           return _drawActionBar($blockParent);
                        });
                    }
                }

                //helper functions
                function findNearestValidParent($mouse_target){
                    // find the nearest valid parent
                    var $blockParent = null;
                    var foundClosest = false;
                    $mouse_target.parents().each( function() {
                        if(foundClosest) { return; }
                        //else

                        var $thisNode = $(this);
                        if(  _isValid( $thisNode ) ){
                            // we've found the first parent of the selected text that is block-level
                            $blockParent = $(this);
                            foundClosest = true;
                        }
                    });

                    return $blockParent;
                }
                function _drawActionBar ($blockParent){
                    var hash = $blockParent.data('hash'),
                        summary = ANT.summaries[hash] || 'undefined';

                    if ( _writeModeOpenForThisContainer(hash) ) return false;
                    //else

                    if ( summary != 'undefined') {
                        var $indicator = summary.$indicator;
                        ANT.actions.indicators.helpers.out($indicator);
                    }
                    // closes undragged windows
                    //close with our own event instead of removing directly so that I can bind an event to the remove event (thanks ie.)
                    ANT.aWindow.close( $('div.ant.ant_window.ant.ant_rewritable') );

                    var actionbarCoords = mouseEvent ? {
                        top: parseInt(mouseEvent.pageY, 10)-7,
                        left: parseInt(mouseEvent.pageX, 10)-25
                    } : {
                        top: $mouse_target.offset().top,
                        left: $mouse_target.offset().left
                    };

                    return ANT.actionbar.draw({
                        coords:actionbarCoords,
                        kind:"text",
                        content:selected.text,
                        hash:$blockParent.data('hash')
                    });

                }
                function _writeModeOpenForThisContainer(hash){

                    /*todo: quick fix - check for other writemode aWindows for this container that are already open.*/
                    /*
                    if it has a summary, check for a aWindow.
                    Of course, if it's brand new, it won't have a summary, but then it wont have a aWindow either
                    */
                    var summary = ANT.summaries[hash] || 'undefined';
                    if( !summary ) return false;
                    //only allow one writemode per container at a time, check for writemode aWindow.
                    var $aWindow_writemode = summary.$aWindow_writemode;
                    if( $aWindow_writemode && $aWindow_writemode.filter(":visible").length ){
                        return $aWindow_writemode;
                    }else{
                        return false;
                    }
                }
                function _isValid($node){
                    var validity = ( ( $node.css('display') == "block" || $node.css('display') == "list-item" ) &&
                        // $node.css('float') == "none" &&
                        ! $node.closest('.ant_indicator').length &&
                        ! $node.is('html, body')
                    );
                    return validity;
                }
            },
            startSelectFromMouseUp: function(e) {
                //ANT.actions.startSelectFromMouseUp
                var $mouse_target = $(e.target);
                ANT.actions.startSelect($mouse_target, e);
            },
            stripAntNode: function($els) {
                //ANT.actions.stripAntNode
                $els.removeAttr('ant-node ant-hasIndicator ant-hashed ant_summary_loaded ant-hash').off('mouseenter.ant').find('.ant_indicator').remove();
            },
            pages: {
                //ANT.actions.pages:
                save: function(id, page){
                    //ANT.actions.pages.save:
                    ANT.pages[page.id] = page;
                },
                initPageContainer: function(pageId){
                    // ANT.actions.pages.initPageContainer
                    var page = ANT.pages[pageId],
                        key = page.urlhash; //todo: consider phasing out - use id instead
                        // key = page.key; //todo: consider phasing out - use id instead   

                    var $container = ( $(ANT.group.post_selector + '[ant-page-key="'+key+'"]').length == 1 ) ? $(ANT.group.post_selector + '[ant-page-key="'+key+'"]'):$('body[ant-page-key]');

                    if ( $container.length !== 1 ) return;
                    //else
                    $container.removeAttr( 'ant-page-key' );
                    $container.attr( 'ant-page-container' , pageId );

                    //todo: [eric] this can't be right - we shouldn't just hash a single number like '1'.
                    var hash = ANT.util.md5.hex_md5( String(page.id) );
                    var tagName = $container.get(0).nodeName.toLowerCase();  //todo: looks like we're not using this for pages?

                    ANT.actions.containers.save({
                        id: String(page.id),
                        kind: "page",
                        hash: hash,
                        HTMLkind: null
                    });

                    $container.data( 'page_id', String(page.id) ); // the page ID

                    //todo: can't we use the hashes returned by this function instead?

                    // is the post_selector the same node as the active_section?
                    // determined by seeing if the active_section exists, just not inside the post_selector
                    if ( ANT.group.post_selector && !$(ANT.group.post_selector).first().find(ANT.group.active_sections).length && $(ANT.group.active_sections).length ) {
                        // ANT.group.active_sections = '';
                        // active_sections_with_anno_whitelist = ANT.group.anno_whitelist;
                        ANT.actions.hashNodes( $container.parent() );
                    } else {
                        ANT.actions.hashNodes( $container );
                    }

                    var hashesByPageId = {};
                    if ( page.containers.length > 0 ) {
                        hashesByPageId[ page.id ] = [];
                        $.each( page.containers, function(idx, container) {
                            if ( typeof container.hash != "undefined") {
                                hashesByPageId[ page.id ].push( container.hash );
                            }
                        });

                        // ANT.actions.sendHashes( hashesByPageId );
                    // } else if ( page && $('[ant-crossPageContent="true"]').length ) {
                    }

                    if ( page && $container.find('[ant-item]').length ) {
                        // [pb] should this be $('[ant-item]') instead of crossPageContent??
                        // [pb] 10/2013: methinks yes, b/c we want to ensure a custom display is visible. 
                        //               see comment right below:

                        // if no reactions on this page, but there is a cross-page container... force a call.  
                        //    // just grab the first crosspage hash.. we get them all later.  
                        //    // not exactly pretty, but i don't want to grab them all, b/c later we get them all and then also remove cross-page ones from the
                        //    // known_hash list, to prevent some duplication.
                        // var hashesByPageId = {};
                        hashesByPageId[ page.id ] = hashesByPageId[ page.id ] || [];

                        // should we find custom-display nodes and add to the hashList here?
                        $.each( $container.find('[ant-item]'), function( idx, node ) {
                            ANT.actions.hashNodes( $(node) );
                            var thisHash = $(node).attr('ant-hash');

                            if (typeof thisHash != 'undefined') {
                                hashesByPageId[ page.id ].push( thisHash );
                            }
                        });
                        // hashesByPageId[ page.id ].push( $('[ant-item="true"]:eq(0)').attr('ant-hash') );
                        // ANT.actions.sendHashes( hashesByPageId );
                    }

                    ANT.actions.sendHashes( hashesByPageId );

                    ANT.current.first_hashed_content = $(ANT.group.active_sections).find('[ant-hash]').first().attr('ant-hash');

                    if (!ANT.util.activeAB()) return;

                    //init the widgetSummary
                    var widgetSummarySettings = page;

                    widgetSummarySettings.key = key;

                    if ( $container.find( ANT.group.summary_widget_selector).length > 0 && $container.find( ANT.group.summary_widget_selector+'[ant-page-widget-key="' + key + '"]') ) {
                        widgetSummarySettings.$anchor = $container.find(ANT.group.summary_widget_selector).eq(0);
                        
                    } else if( $(".ant-page-summary").length==1 ){
                        widgetSummarySettings.$anchor = $(".ant-page-summary").eq(0); //change to group.summaryWidgetAnchorNode or whatever
                    }else{
                        //use the default summaryBar instead
                        // do NOT set the bottom to -1000px -- that's because the widget CSS sets a TOP value... so a TOP of 0 still displays the summary bar, and makes it cover the whole page (since it is stretched to -1000px below bottom to boot)
                        // var displayDefaultBar = ( ANT.group.useDefaultSummaryBar === true ) ? "top:-1000px !important":"";
                        // widgetSummarySettings.$anchor = $('<div id="ant-page-summary" class="ant no-ant ant-page-summary defaultSummaryBar" style="top:-1001px !important"/>');
                        // widgetSummarySettings.$anchor.appendTo('body');
                    }
                    
                    //div to hold summary tag detail "menus"
                    $('#ant_sandbox').append('<div id="ant_summary_tag_details" />');

                    //setup widgetSummary
                    if (widgetSummarySettings.$anchor && widgetSummarySettings.$anchor.length) {
                        if ( ($('div.ant-summary').length===0) || ( $('div.ant-summary').length < $(ANT.group.post_selector).length ) ) {
                            widgetSummarySettings.$anchor.antWidgetSummary(widgetSummarySettings);
                        }
                    }

                }
            },
            users: {
                //ANT.actions.users:
                save: function(id, settings){
                    //ANT.actions.users.save:

                }
            }
        }//end ANT.actions
    });
}


//from http://www.aaronpeters.nl/blog/prevent-double-callback-execution-in-IE9#comment-175618750
function ant_loadScript(attributes, callbackfunction) {
    var oHead = document.getElementsByTagName('head')[0];
    if(oHead) {
        var oScript = document.createElement('script');

        oScript.setAttribute('src', attributes.src);
        oScript.setAttribute('type','text/javascript');



        if (oScript.readyState) { // IE, incl. IE9
            oScript.onreadystatechange = function() {
                if (oScript.readyState == "loaded" || oScript.readyState == "complete") {
                    oScript.onreadystatechange = null;
                    callbackfunction();
                }
            };
        } else {
            oScript.onload = function() { // Other browsers
                callbackfunction();
            };
        }

        oHead.appendChild(oScript);
    }
}

//add to ANT for use later.
ANT.ant_loadScript = ant_loadScript;

//load jQuery overwriting the client's jquery, create our $A clone, and revert the client's jquery back
ANT_scriptPaths.jquery = ANT_offline ?
    ANT_staticUrl+"widget/js/jquery-1.11.1.min.js" :
    // ANT_staticUrl+"global/js/jquery-1.7.1.min.js" :
    // "http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js";
    "//cdnjs.cloudflare.com/ajax/libs/jquery/1.11.1/jquery.min.js";

// dont think we use this -- we embedded it below.
// ANT_scriptPaths.mobileEvents = ANT_staticUrl+"global/js/jquery.mobile-events.js";

// ANT_scriptPaths.jqueryUI = ANT_offline ?
//     ANT_staticUrl+"global/js/jquery-ui-1.8.17.min.js" :
//     "http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.17/jquery-ui.min.js";

// ANT_scriptPaths.jqueryWithJqueryUI = ANT_offline ? 
//     ANT_staticUrl+"global/js/jquery-1.7.1-with-ui-1.8.17.js" :
//     ANT_staticUrl+"global/js/jquery-1.7.1.min-with-ui-1.8.17.min.js";

// ANT_scriptPaths.jqueryUI_CSS = ANT_offline ?
//     ANT_staticUrl+"global/css/jquery-ui-1.8.17.base.css" :
//     "http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.17/themes/base/jquery-ui.css";

ant_loadScript({src:ANT_scriptPaths.jquery}, function(){
    
    if(isTouchBrowser){
        load_mobileEvents(jQuery);
    }
    jquery_onload(jQuery);
});

function jquery_onload(jQuery){

    //Give back the $ and jQuery.
    $A = jQuery.noConflict(true);
    var $ = $A;

    // add $.browser functionality back since we're using a newer version of jQuery, but some of our code + older plugins rely on it.
    /*!
     * jQuery Browser Plugin 0.0.5
     * https://github.com/gabceb/jquery-browser-plugin
     *
     * Original jquery-browser code Copyright 2005, 2013 jQuery Foundation, Inc. and other contributors
     * http://jquery.org/license
     *
     * Modifications Copyright 2014 Gabriel Cebrian
     * https://github.com/gabceb
     *
     * Released under the MIT license
     *
     * Date: 05-01-2014
     */
    !function(a,b){"use strict";var c,d;if(a.uaMatch=function(a){a=a.toLowerCase();var b=/(opr)[\/]([\w.]+)/.exec(a)||/(chrome)[ \/]([\w.]+)/.exec(a)||/(version)[ \/]([\w.]+).*(safari)[ \/]([\w.]+)/.exec(a)||/(webkit)[ \/]([\w.]+)/.exec(a)||/(opera)(?:.*version|)[ \/]([\w.]+)/.exec(a)||/(msie) ([\w.]+)/.exec(a)||a.indexOf("trident")>=0&&/(rv)(?::| )([\w.]+)/.exec(a)||a.indexOf("compatible")<0&&/(mozilla)(?:.*? rv:([\w.]+)|)/.exec(a)||[],c=/(ipad)/.exec(a)||/(iphone)/.exec(a)||/(android)/.exec(a)||/(windows phone)/.exec(a)||/(win)/.exec(a)||/(mac)/.exec(a)||/(linux)/.exec(a)||[];return{browser:b[3]||b[1]||"",version:b[2]||"0",platform:c[0]||""}},c=a.uaMatch(b.navigator.userAgent),d={},c.browser&&(d[c.browser]=!0,d.version=c.version,d.versionNumber=parseInt(c.version)),c.platform&&(d[c.platform]=!0),(d.chrome||d.opr||d.safari)&&(d.webkit=!0),d.rv){var e="msie";c.browser=e,d[e]=!0}if(d.opr){var f="opera";c.browser=f,d[f]=!0}if(d.safari&&d.android){var g="android";c.browser=g,d[g]=!0}d.name=c.browser,d.platform=c.platform,a.browser=d}($,window);


    if ( $.browser.msie  && parseInt($.browser.version, 10) < 9 ) {
        return false;
    }
    if ( $.browser.msie  && parseInt($.browser.version, 10) == 8 ) {
        $('body').addClass('ant_ie');
    }
    
    //A function to load all plugins including those (most) that depend on jQuery.
    //The rest of our code is then set off with ANT.actions.init();
    $AFunctions($A);
}

function load_mobileEvents(jQuery){
    (function(e){function d(){var e=o();if(e!==u){u=e;i.trigger("orientationchange")}}function E(t,n,r,i){var s=r.type;r.type=n;e.event.dispatch.call(t,r,i);r.type=s}e.attrFn=e.attrFn||{};var t=navigator.userAgent.toLowerCase(),n=t.indexOf("chrome")>-1&&(t.indexOf("windows")>-1||t.indexOf("macintosh")>-1||t.indexOf("linux")>-1)&&t.indexOf("chrome")<0,r={swipe_h_threshold:50,swipe_v_threshold:50,taphold_threshold:750,doubletap_int:500,touch_capable:"ontouchstart"in document.documentElement&&!n,orientation_support:"orientation"in window&&"onorientationchange"in window,startevent:"ontouchstart"in document.documentElement&&!n?"touchstart":"mousedown",endevent:"ontouchstart"in document.documentElement&&!n?"touchend":"mouseup",moveevent:"ontouchstart"in document.documentElement&&!n?"touchmove":"mousemove",tapevent:"ontouchstart"in document.documentElement&&!n?"tap":"click",scrollevent:"ontouchstart"in document.documentElement&&!n?"touchmove":"scroll",hold_timer:null,tap_timer:null};e.isTouchCapable=function(){return r.touch_capable};e.getStartEvent=function(){return r.startevent};e.getEndEvent=function(){return r.endevent};e.getMoveEvent=function(){return r.moveevent};e.getTapEvent=function(){return r.tapevent};e.getScrollEvent=function(){return r.scrollevent};e.each(["tapstart","tapend","tap","singletap","doubletap","taphold","swipe","swipeup","swiperight","swipedown","swipeleft","swipeend","scrollstart","scrollend","orientationchange"],function(t,n){e.fn[n]=function(e){return e?this.bind(n,e):this.trigger(n)};e.attrFn[n]=true});e.event.special.tapstart={setup:function(){var t=this,n=e(t);n.bind(r.startevent,function(e){n.data("callee",arguments.callee);if(e.which&&e.which!==1){return false}var i=e.originalEvent,s={position:{x:r.touch_capable?i.touches[0].screenX:e.screenX,y:r.touch_capable?i.touches[0].screenY:e.screenY},offset:{x:r.touch_capable?i.touches[0].pageX-i.touches[0].target.offsetLeft:e.offsetX,y:r.touch_capable?i.touches[0].pageY-i.touches[0].target.offsetTop:e.offsetY},time:(new Date).getTime(),target:e.target};E(t,"tapstart",e,s);return true})},remove:function(){e(this).unbind(r.startevent,e(this).data.callee)}};e.event.special.tapend={setup:function(){var t=this,n=e(t);n.bind(r.endevent,function(e){n.data("callee",arguments.callee);var i=e.originalEvent;var s={position:{x:r.touch_capable?i.changedTouches[0].screenX:e.screenX,y:r.touch_capable?i.changedTouches[0].screenY:e.screenY},offset:{x:r.touch_capable?i.changedTouches[0].pageX-i.changedTouches[0].target.offsetLeft:e.offsetX,y:r.touch_capable?i.changedTouches[0].pageY-i.changedTouches[0].target.offsetTop:e.offsetY},time:(new Date).getTime(),target:e.target};E(t,"tapend",e,s);return true})},remove:function(){e(this).unbind(r.endevent,e(this).data.callee)}};e.event.special.taphold={setup:function(){var t=this,n=e(t),i,s,o={x:0,y:0};n.bind(r.startevent,function(e){if(e.which&&e.which!==1){return false}else{n.data("tapheld",false);i=e.target;var s=e.originalEvent;var u=(new Date).getTime(),a={x:r.touch_capable?s.touches[0].screenX:e.screenX,y:r.touch_capable?s.touches[0].screenY:e.screenY},f={x:r.touch_capable?s.touches[0].pageX-s.touches[0].target.offsetLeft:e.offsetX,y:r.touch_capable?s.touches[0].pageY-s.touches[0].target.offsetTop:e.offsetY};o.x=e.originalEvent.targetTouches?e.originalEvent.targetTouches[0].pageX:e.pageX;o.y=e.originalEvent.targetTouches?e.originalEvent.targetTouches[0].pageY:e.pageY;r.hold_timer=window.setTimeout(function(){var l=e.originalEvent.targetTouches?e.originalEvent.targetTouches[0].pageX:e.pageX,c=e.originalEvent.targetTouches?e.originalEvent.targetTouches[0].pageY:e.pageY;if(e.target==i&&o.x==l&&o.y==c){n.data("tapheld",true);var h=(new Date).getTime(),p={x:r.touch_capable?s.touches[0].screenX:e.screenX,y:r.touch_capable?s.touches[0].screenY:e.screenY},d={x:r.touch_capable?s.touches[0].pageX-s.touches[0].target.offsetLeft:e.offsetX,y:r.touch_capable?s.touches[0].pageY-s.touches[0].target.offsetTop:e.offsetY};duration=h-u;var v={startTime:u,endTime:h,startPosition:a,startOffset:f,endPosition:p,endOffset:d,duration:duration,target:e.target};n.data("callee1",arguments.callee);E(t,"taphold",e,v)}},r.taphold_threshold);return true}}).bind(r.endevent,function(){n.data("callee2",arguments.callee);n.data("tapheld",false);window.clearTimeout(r.hold_timer)})},remove:function(){e(this).unbind(r.startevent,e(this).data.callee1).unbind(r.endevent,e(this).data.callee2)}};e.event.special.doubletap={setup:function(){var t=this,n=e(t),i,s,o,u;n.bind(r.startevent,function(e){if(e.which&&e.which!==1){return false}else{n.data("doubletapped",false);i=e.target;n.data("callee1",arguments.callee);u=e.originalEvent;o={position:{x:r.touch_capable?u.touches[0].screenX:e.screenX,y:r.touch_capable?u.touches[0].screenY:e.screenY},offset:{x:r.touch_capable?u.touches[0].pageX-u.touches[0].target.offsetLeft:e.offsetX,y:r.touch_capable?u.touches[0].pageY-u.touches[0].target.offsetTop:e.offsetY},time:(new Date).getTime(),target:e.target};return true}}).bind(r.endevent,function(e){var a=(new Date).getTime();var f=n.data("lastTouch")||a+1;var l=a-f;window.clearTimeout(s);n.data("callee2",arguments.callee);if(l<r.doubletap_int&&l>0&&e.target==i&&l>100){n.data("doubletapped",true);window.clearTimeout(r.tap_timer);var c={position:{x:r.touch_capable?u.touches[0].screenX:e.screenX,y:r.touch_capable?u.touches[0].screenY:e.screenY},offset:{x:r.touch_capable?u.touches[0].pageX-u.touches[0].target.offsetLeft:e.offsetX,y:r.touch_capable?u.touches[0].pageY-u.touches[0].target.offsetTop:e.offsetY},time:(new Date).getTime(),target:e.target};var h={firstTap:o,secondTap:c,interval:c.time-o.time};E(t,"doubletap",e,h)}else{n.data("lastTouch",a);s=window.setTimeout(function(e){window.clearTimeout(s)},r.doubletap_int,[e])}n.data("lastTouch",a)})},remove:function(){e(this).unbind(r.startevent,e(this).data.callee1).unbind(r.endevent,e(this).data.callee2)}};e.event.special.singletap={setup:function(){var t=this,n=e(t),i=null,s=null,o={x:0,y:0};n.bind(r.startevent,function(e){if(e.which&&e.which!==1){return false}else{s=(new Date).getTime();i=e.target;n.data("callee1",arguments.callee);o.x=e.originalEvent.targetTouches?e.originalEvent.targetTouches[0].pageX:e.pageX;o.y=e.originalEvent.targetTouches?e.originalEvent.targetTouches[0].pageY:e.pageY;return true}}).bind(r.endevent,function(e){n.data("callee2",arguments.callee);if(e.target==i){end_pos_x=e.originalEvent.changedTouches?e.originalEvent.changedTouches[0].pageX:e.pageX;end_pos_y=e.originalEvent.changedTouches?e.originalEvent.changedTouches[0].pageY:e.pageY;r.tap_timer=window.setTimeout(function(){if(!n.data("doubletapped")&&!n.data("tapheld")&&o.x==end_pos_x&&o.y==end_pos_y){var i=e.originalEvent;var u={position:{x:r.touch_capable?i.changedTouches[0].screenX:e.screenX,y:r.touch_capable?i.changedTouches[0].screenY:e.screenY},offset:{x:r.touch_capable?i.changedTouches[0].pageX-i.changedTouches[0].target.offsetLeft:e.offsetX,y:r.touch_capable?i.changedTouches[0].pageY-i.changedTouches[0].target.offsetTop:e.offsetY},time:(new Date).getTime(),target:e.target};if(u.time-s<r.taphold_threshold){E(t,"singletap",e,u)}}},r.doubletap_int)}})},remove:function(){e(this).unbind(r.startevent,e(this).data.callee1).unbind(r.endevent,e(this).data.callee2)}};e.event.special.tap={setup:function(){var t=this,n=e(t),i=false,s=null,o,u={x:0,y:0};n.bind(r.startevent,function(e){n.data("callee1",arguments.callee);if(e.which&&e.which!==1){return false}else{i=true;u.x=e.originalEvent.targetTouches?e.originalEvent.targetTouches[0].pageX:e.pageX;u.y=e.originalEvent.targetTouches?e.originalEvent.targetTouches[0].pageY:e.pageY;o=(new Date).getTime();s=e.target;return true}}).bind(r.endevent,function(e){n.data("callee2",arguments.callee);var a=e.originalEvent.targetTouches?e.originalEvent.changedTouches[0].pageX:e.pageX,f=e.originalEvent.targetTouches?e.originalEvent.changedTouches[0].pageY:e.pageY;if(s==e.target&&i&&(new Date).getTime()-o<r.taphold_threshold&&u.x==a&&u.y==f){var l=e.originalEvent;var c={position:{x:r.touch_capable?l.changedTouches[0].screenX:e.screenX,y:r.touch_capable?l.changedTouches[0].screenY:e.screenY},offset:{x:r.touch_capable?l.changedTouches[0].pageX-l.changedTouches[0].target.offsetLeft:e.offsetX,y:r.touch_capable?l.changedTouches[0].pageY-l.changedTouches[0].target.offsetTop:e.offsetY},time:(new Date).getTime(),target:e.target};E(t,"tap",e,c)}})},remove:function(){e(this).unbind(r.startevent,e(this).data.callee1).unbind(r.endevent,e(this).data.callee2)}};e.event.special.swipe={setup:function(){function f(t){n=e(t.target);n.data("callee1",arguments.callee);o.x=t.originalEvent.targetTouches?t.originalEvent.targetTouches[0].pageX:t.pageX;o.y=t.originalEvent.targetTouches?t.originalEvent.targetTouches[0].pageY:t.pageY;u.x=o.x;u.y=o.y;i=true;var s=t.originalEvent;a={position:{x:r.touch_capable?s.touches[0].screenX:t.screenX,y:r.touch_capable?s.touches[0].screenY:t.screenY},offset:{x:r.touch_capable?s.touches[0].pageX-s.touches[0].target.offsetLeft:t.offsetX,y:r.touch_capable?s.touches[0].pageY-s.touches[0].target.offsetTop:t.offsetY},time:(new Date).getTime(),target:t.target};var f=new Date;while(new Date-f<100){}}function l(t){n=e(t.target);n.data("callee2",arguments.callee);u.x=t.originalEvent.targetTouches?t.originalEvent.targetTouches[0].pageX:t.pageX;u.y=t.originalEvent.targetTouches?t.originalEvent.targetTouches[0].pageY:t.pageY;window.clearTimeout(r.hold_timer);var f;var l=n.data("xthreshold"),c=n.data("ythreshold"),h=typeof l!=="undefined"&&l!==false&&parseInt(l)?parseInt(l):r.swipe_h_threshold,p=typeof c!=="undefined"&&c!==false&&parseInt(c)?parseInt(c):r.swipe_v_threshold;if(o.y>u.y&&o.y-u.y>p){f="swipeup"}if(o.x<u.x&&u.x-o.x>h){f="swiperight"}if(o.y<u.y&&u.y-o.y>p){f="swipedown"}if(o.x>u.x&&o.x-u.x>h){f="swipeleft"}if(f!=undefined&&i){o.x=0;o.y=0;u.x=0;u.y=0;i=false;var d=t.originalEvent;endEvnt={position:{x:r.touch_capable?d.touches[0].screenX:t.screenX,y:r.touch_capable?d.touches[0].screenY:t.screenY},offset:{x:r.touch_capable?d.touches[0].pageX-d.touches[0].target.offsetLeft:t.offsetX,y:r.touch_capable?d.touches[0].pageY-d.touches[0].target.offsetTop:t.offsetY},time:(new Date).getTime(),target:t.target};var v=Math.abs(a.position.x-endEvnt.position.x),m=Math.abs(a.position.y-endEvnt.position.y);var g={startEvnt:a,endEvnt:endEvnt,direction:f.replace("swipe",""),xAmount:v,yAmount:m,duration:endEvnt.time-a.time};s=true;n.trigger("swipe",g).trigger(f,g)}}function c(t){n=e(t.target);var o="";n.data("callee3",arguments.callee);if(s){var u=n.data("xthreshold"),f=n.data("ythreshold"),l=typeof u!=="undefined"&&u!==false&&parseInt(u)?parseInt(u):r.swipe_h_threshold,c=typeof f!=="undefined"&&f!==false&&parseInt(f)?parseInt(f):r.swipe_v_threshold;var h=t.originalEvent;endEvnt={position:{x:r.touch_capable?h.changedTouches[0].screenX:t.screenX,y:r.touch_capable?h.changedTouches[0].screenY:t.screenY},offset:{x:r.touch_capable?h.changedTouches[0].pageX-h.changedTouches[0].target.offsetLeft:t.offsetX,y:r.touch_capable?h.changedTouches[0].pageY-h.changedTouches[0].target.offsetTop:t.offsetY},time:(new Date).getTime(),target:t.target};if(a.position.y>endEvnt.position.y&&a.position.y-endEvnt.position.y>c){o="swipeup"}if(a.position.x<endEvnt.position.x&&endEvnt.position.x-a.position.x>l){o="swiperight"}if(a.position.y<endEvnt.position.y&&endEvnt.position.y-a.position.y>c){o="swipedown"}if(a.position.x>endEvnt.position.x&&a.position.x-endEvnt.position.x>l){o="swipeleft"}var p=Math.abs(a.position.x-endEvnt.position.x),d=Math.abs(a.position.y-endEvnt.position.y);var v={startEvnt:a,endEvnt:endEvnt,direction:o.replace("swipe",""),xAmount:p,yAmount:d,duration:endEvnt.time-a.time};n.trigger("swipeend",v)}i=false;s=false}var t=this,n=e(t),i=false,s=false,o={x:0,y:0},u={x:0,y:0},a;n.bind(r.startevent,f);n.bind(r.moveevent,l);n.bind(r.endevent,c)},remove:function(){e(this).unbind(r.startevent,e(this).data.callee1).unbind(r.moveevent,e(this).data.callee2).unbind(r.endevent,e(this).data.callee3)}};e.event.special.scrollstart={setup:function(){function o(e,n){i=n;E(t,i?"scrollstart":"scrollend",e)}var t=this,n=e(t),i,s;n.bind(r.scrollevent,function(e){n.data("callee",arguments.callee);if(!i){o(e,true)}clearTimeout(s);s=setTimeout(function(){o(e,false)},50)})},remove:function(){e(this).unbind(r.scrollevent,e(this).data.callee)}};var i=e(window),s,o,u,a,f,l={0:true,180:true};if(r.orientation_support){var c=window.innerWidth||e(window).width(),h=window.innerHeight||e(window).height(),p=50;a=c>h&&c-h>p;f=l[window.orientation];if(a&&f||!a&&!f){l={"-90":true,90:true}}}e.event.special.orientationchange=s={setup:function(){if(r.orientation_support){return false}u=o();i.bind("throttledresize",d);return true},teardown:function(){if(r.orientation_support){return false}i.unbind("throttledresize",d);return true},add:function(e){var t=e.handler;e.handler=function(e){e.orientation=o();return t.apply(this,arguments)}}};e.event.special.orientationchange.orientation=o=function(){var e=true,t=document.documentElement;if(r.orientation_support){e=l[window.orientation]}else{e=t&&t.clientWidth/t.clientHeight<1.1}return e?"portrait":"landscape"};e.event.special.throttledresize={setup:function(){e(this).bind("resize",m)},teardown:function(){e(this).unbind("resize",m)}};var v=250,m=function(){b=(new Date).getTime();w=b-g;if(w>=v){g=b;e(this).trigger("throttledresize")}else{if(y){window.clearTimeout(y)}y=window.setTimeout(d,v-w)}},g=0,y,b,w;e.each({scrollend:"scrollstart",swipeup:"swipe",swiperight:"swipe",swipedown:"swipe",swipeleft:"swipe",swipeend:"swipe"},function(t,n,r){e.event.special[t]={setup:function(){e(this).bind(n,e.noop)}}})})(jQuery);
}

function $AFunctions($A){
    //called after our version of jQuery ($A) is loaded
    
    //alias $ here as well to be the same as our $A version of jQuery;
    var $ = $A;

    // temporarily hide .ant so there's no FOUC
    $('body').append('<style>.ant-summary, .ant_indicator {display:none;}</style>')
    
    //load CSS
    var css = [];

    if ( !$A.browser.msie || ( $A.browser.msie && parseInt( $A.browser.version, 10 ) > 8 ) ) {
        css.push( ANT_staticUrl+"css/antenna-font/antenna-font.css" );
        // css.push( ANT_staticUrl+"css/fonts/fontawesome.css" );
        // css.push( ANT_staticUrl+"css/antenna-font/antenna-font.css" );
    }
    if ( $A.browser.msie ) {
        css.push( ANT_staticUrl+"widget/css/ie.css" );
        //todo: make sure that if this css file doens't exist, it won't bork.  Otherwise as soon as IE10 comes out, this will kill it.
        css.push( ANT_staticUrl+"widget/css/ie"+parseInt( $A.browser.version, 10) +".css" );
    }

    var widgetCSS = ( ANT_offline ) ? ANT_widgetCssStaticUrl+"widget/css/newwidget.css" : ANT_widgetCssStaticUrl+"widget/css/newwidget.min.css?rv36"
    css.push( widgetCSS );
    // css.push( ANT_scriptPaths.jqueryUI_CSS );
    css.push( ANT_staticUrl+"widget/css/jquery.jscrollpane.css" );

    loadCSS(css);

    function loadCSS(cssFileList){

        $A.each(cssFileList, function(i, val){
            $A('<link>').attr({
                href: val,
                rel: 'stylesheet'
            }).appendTo('body');
        });
    }

    //these are basic utils that can be used both in the plugins and main scripts.  Added to ANT.commonUtil;
    initCommonUtils($A);
        
    //init our plugins (includes rangy, but otherwise, mostly jquery plugins. The $A passed is our jQuery alias)
    initPlugins($A);

    //load our main scripts
    antenna($A);

    //run init functions
    ANT.actions.init();

    function initCommonUtils($){
        $.extend(ANT, {
            commonUtil: {
                prettyNumber: function(anInt){
                    // ANT.commonUtil.prettyNumber:
                    var parsedInt = parseInt(anInt, 10); //convert if we can.
                    if( isNaN(parsedInt) || parsedInt<0 ) return false;
                    //else

                    var abr = ["",'K','M','B','T'];
                    for(var i=0; i<abr.length; i++){
                        var thisfactor = Math.pow(10, 3*i);
                        var nextfactor = Math.pow(10, 3*(i+1));
                        if( parsedInt < nextfactor ){
                            return ""+ Math.floor( parsedInt/thisfactor ) + abr[i];
                        }
                    }
                }
            }
        });
    }

    function initPlugins($A){
        //All jquery plugins to be loaded using our $A version of jquery and before our widget code;

        //Rangy - init before our jquery
        var rangy = plugin_rangy();
        window.rangy = rangy;
        rangy.init();

        //jQuery Plugins
        plugin_jquery_log($A);
        plugin_jquery_hasAttr($A);
        plugin_jquery_json($A);
        plugin_jquery_postMessage($A);
        plugin_jquery_mustache($A);
        plugin_jquery_enhancedOffset($A);
        plugin_jquery_drags($A);
        plugin_jquery_mousewheel($A);
        plugin_jquery_scrollStopStart($A);
        plugin_jquery_jScrollPane($A);
        plugin_jquery_twitterTip($A);
        plugin_jquery_antWidgetSummary($A);
        plugin_jquery_selectionographer($A, rangy);

        /* are we using this */
        //todo: maybe need to fix this...
        // parents filter:  http://stackoverflow.com/questions/965816/what-jquery-selector-excludes-items-with-a-parent-that-matches-a-given-selector
        // doesn't seem to be working tho.
        $A.expr[':'].parents = function(a,i,m){
            return $A(a).parents(m[3]).length < 1;
        };


        /** start plugin functions **/
        
        function plugin_jquery_log($){
            var jQuery = $;
            /**
             * jQuery Log
             * Fast & safe logging in Firebug console
             *
             * @param mixed - as many parameters as needed
             * @return void
             *
             * @url http://plugins.jquery.com/project/jQueryLog
             * @author Amal Samally [amal.samally(at)gmail.com]
             * @version 1.0
             * @example:
             *      $.log(someObj, someVar);
             *      $.log("%s is %d years old.", "Bob", 42);
             *      $('div.someClass').log().hide();
             */
            $.clog = function () {
                if ( window.console && window.console.log && window.console.log.apply ) {
                    window.console.log.apply(window.console, arguments);
                }
            };
            $.fn.clog = function () {
                var logArgs = arguments || this;
                $.clog(logArgs);
                return this;
            };


            //alias console.log to global log
            //in case client already has log defined (remove for production anyway)
            if (typeof clog === "undefined"){
                clog = function(){

                    // [pb] I want comma-separated strings, bools, and ints to appear on same line.  by default, this plugin separates them on different lines
                    // so, I'm not looping through the args, just logging directly.  this means the args will always look like an array.  I'm down w/ that for a quick-fix here.
                    // this also preserves argument type.  if you run $.clog("1", 1, true)... the console will show ["1", 1, true]
                    $.clog( arguments );

                    // [pb] removed:
                    // $.each(arguments, function(idx, val){
                        // $.clog(val);
                    // });
                };
            }

            //add in alias temporaily to client $ so we can use regular $ instead of $A if we want
            if(typeof jQuery !== 'undefined'){
                jQuery.clog = $.clog;
                jQuery.fn.clog = $.fn.clog;
            }

        }
        //end function plugin_jquery_log

        function plugin_jquery_hasAttr($){
            $.fn.hasAttr = function(name) {  
                return this.attr(name) !== undefined;
            };
        }
        function plugin_jquery_json($){
            /* jquery json v2.2 */
            /* http://code.google.com/p/jquery-json/ */
            $.toJSON=function(o)

            {
                // TODO: reassess?  we're ignoring the native JSON obj because some people think their frameworks should be allowed to modify the global Array and/or JSON objects:
                // if(typeof(JSON)=='object'&&JSON.stringify) {
                //     return JSON.stringify(o);
                // }
                var type=typeof(o);
                if(o===null)
                    return"null";
                if(type=="undefined")
                    return undefined;
                if(type=="number"||type=="boolean")
                    return o+"";
                if(type=="string")
                    return $.quoteString(o);
                if(type=='object')

                {
                    // TODO: reassess?  we're ignoring the native JSON obj because some people think their frameworks should be allowed to modify the global Array and/or JSON objects:
                    // if(typeof o.toJSON=="function")
                    //     return $.toJSON(o.toJSON());
                    if(o.constructor===Date)

                    {
                        var month=o.getUTCMonth()+1;
                        if(month<10)month='0'+month;
                        var day=o.getUTCDate();
                        if(day<10)day='0'+day;
                        var year=o.getUTCFullYear();
                        var hours=o.getUTCHours();
                        if(hours<10)hours='0'+hours;
                        var minutes=o.getUTCMinutes();
                        if(minutes<10)minutes='0'+minutes;
                        var seconds=o.getUTCSeconds();
                        if(seconds<10)seconds='0'+seconds;
                        var milli=o.getUTCMilliseconds();
                        if(milli<100)milli='0'+milli;
                        if(milli<10)milli='0'+milli;
                        return'"'+year+'-'+month+'-'+day+'T'+
                        hours+':'+minutes+':'+seconds+'.'+milli+'Z"';
                    }
                    if(o.constructor===Array)
                    {
                        var ret=[];
                        for(var i=0;i<o.length;i++)
                            ret.push($.toJSON(o[i])||"null");
                        return"["+ret.join(",")+"]";
                    }
                    var pairs=[];
                    for(var k in o){
                        var name;
                        var type=typeof k;
                        if(type=="number")
                            name='"'+k+'"';
                        else if(type=="string")
                            name=$.quoteString(k);else
                            continue;
                        if(typeof o[k]=="function")
                            continue;
                        var val=$.toJSON(o[k]);
                        if (typeof val != "undefined" ) pairs.push(name+":"+val);
                    }
                    return"{"+pairs.join(", ")+"}";
                }
            };

            $.evalJSON=function(src)

            {
                // TODO: reassess?  we're ignoring the native JSON obj because some people think their frameworks should be allowed to modify the global Array and/or JSON objects:
                // if(typeof(JSON)=='object'&&JSON.parse)
                //     return JSON.parse(src);
                return eval("("+src+")");
            };

            $.secureEvalJSON=function(src)

            {
                // TODO: reassess?  we're ignoring the native JSON obj because some people think their frameworks should be allowed to modify the global Array and/or JSON objects:
                // if(typeof(JSON)=='object'&&JSON.parse)
                //     return JSON.parse(src);
                var filtered=src;
                filtered=filtered.replace(/\\["\\\/bfnrtu]/g,'@');
                filtered=filtered.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,']');
                filtered=filtered.replace(/(?:^|:|,)(?:\s*\[)+/g,'');
                if(/^[\],:{}\s]*$/.test(filtered))
                    return eval("("+src+")");else
                    throw new SyntaxError("Error parsing JSON, source is not valid.");
            };

            $.quoteString=function(string)
            {

                if(string.match(_escapeable))

                {
                    return'"'+string.replace(_escapeable,function(a)

                    {
                            var c=_meta[a];
                            if(typeof c==='string')return c;
                            c=a.charCodeAt();
                            return'\\u00'+Math.floor(c/16).toString(16)+(c%16).toString(16);
                        })+'"';
                }
                return'"'+string+'"';
            };

            var _escapeable=/["\\\x00-\x1f\x7f-\x9f]/g;
            var _meta={
                '\b':'\\b',
                '\t':'\\t',
                '\n':'\\n',
                '\f':'\\f',
                '\r':'\\r',
                '"':'\\"',
                '\\':'\\\\'
            };
        }
        //end function plugin_jquery_json

        function plugin_jquery_postMessage($){
            /*
             * jQuery postMessage - v0.5 - 9/11/2009
             * http://benalman.com/projects/jquery-postmessage-plugin/
             *
             * Copyright (c) 2009 "Cowboy" Ben Alman
             * Dual licensed under the MIT and GPL licenses.
             * http://benalman.com/about/license/
             */
            // var g,d,j=1,a,b=this,f=!1,h="postMessage",e="addEventListener",c,i=b[h]&&!$.browser.opera;$[h]=function(k,l,m){if(!l){return}k=typeof k==="string"?k:$.param(k);m=m||parent;if(i){m[h](k,l.replace(/([^:]+:\/\/[^\/]+).*/,"$1"))}else{if(l){m.location=l.replace(/#.*$/,"")+"#"+(+new Date)+(j++)+"&"+k}}};$.receiveMessage=c=function(l,m,k){if(i){if(l){a&&c();a=function(n){if((typeof m==="string"&&n.origin!==m)||($.isFunction(m)&&m(n.origin)===f)){return f}l(n)}}if(b[e]){b[l?e:"removeEventListener"]("message",a,f)}else{b[l?"attachEvent":"detachEvent"]("onmessage",a)}}else{g&&clearInterval(g);g=null;if(l){k=typeof m==="number"?m:typeof k==="number"?k:100;g=setInterval(function(){var o=document.location.hash,n=/^#?\d+&/;if(o!==d&&n.test(o)){d=o;l({data:o.replace(n,"")})}},k)}}}
            
            // removing the browser.opera check, it breaks latest opera (which does have postMessage)
            var g,d,j=1,a,b=this,f=!1,h="postMessage",e="addEventListener",c,i=b[h];$[h]=function(k,l,m){if(!l){return}k=typeof k==="string"?k:$.param(k);m=m||parent;if(i){m[h](k,l.replace(/([^:]+:\/\/[^\/]+).*/,"$1"))}else{if(l){m.location=l.replace(/#.*$/,"")+"#"+(+new Date)+(j++)+"&"+k}}};$.receiveMessage=c=function(l,m,k){if(i){if(l){a&&c();a=function(n){if((typeof m==="string"&&n.origin!==m)||($.isFunction(m)&&m(n.origin)===f)){return f}l(n)}}if(b[e]){b[l?e:"removeEventListener"]("message",a,f)}else{b[l?"attachEvent":"detachEvent"]("onmessage",a)}}else{g&&clearInterval(g);g=null;if(l){k=typeof m==="number"?m:typeof k==="number"?k:100;g=setInterval(function(){var o=document.location.hash,n=/^#?\d+&/;if(o!==d&&n.test(o)){d=o;l({data:o.replace(n,"")})}},k)}}}
        }
        //end function plugin_jquery_postMessage

        function plugin_jquery_drags(a){
            // replace jquery UI draggable
            // Simple JQuery Draggable Plugin
            // https://plus.google.com/108949996304093815163/about
            // Usage: $(selector).drags();
            // THIS HAS BEEN CUSTOMIZED FOR Antenna
            $.fn.drags = function(opt) {

                opt = $.extend({
                    handle: ""
                    // cursor: "move",
                    // draggableClass: "draggable",
                    // activeHandleClass: "active-handle"
                }, opt);


                var $selected = $(this);
                // var $elements = (opt.handle === "") ? $selected : $selected.find(opt.handle);
                // var $elements = (opt.handle === "") ? this : this.find(opt.handle);
                // FOR SOME REASON, the last two lines tried using the handle as the click handler, and failed.  so instead, below,
                // i see if the click is inside the handle and exit out if not.  
                // which seems less efficient, but works.
                var $elements = $selected;


                $elements.on('mousedown.ant', function(e) {
                    if ( (opt.handle !== "" ) && !$(e.target).closest('.ant_header').length ) {
                        // has a handle, but the handle is not clicked
                        return;
                    }

                    $selected.removeClass("ant_rewritable");

                    var drg_h = $selected.outerHeight(),
                        drg_w = $selected.outerWidth(),
                        offsets = $selected.offset(), // cache
                        pos_y = offsets.top + drg_h - e.pageY,
                        pos_x = offsets.left + drg_w - e.pageX;

                    $(document).on("mousemove.ant_drag", function(e) {
                        $selected.offset({
                            top: e.pageY + pos_y - drg_h,
                            left: e.pageX + pos_x - drg_w
                        });
                    }).on("mouseup.ant", function() {
                        $(this).off("mousemove.ant_drag"); // Unbind events from document
                    });

                    e.preventDefault(); // disable selection
                });

                return this;

            };
        }
        function plugin_jquery_enhancedOffset($){
            /**
             * Enhanced .offset()
             * Abstracts offset().right and offset().bottom into a built-in getter, and adds .offset(top, left) as a setter.
             *
             * @version 1.0
             * @example $('#tester').offset().bottom
             * @example $('#tester').offset().right
             * @example $('#tester').offset(10, 20);
             * @example $('#tester').offset(10, 20, 'fast');
             * @example $('#tester').offset('+=10', '+=20');
             * @example $('#tester').offset('+=5', '-=30');
             * @author Brian Schweitzer (BrianFreud)
             * @author Charles Phillips, first half of the return conditional ( http://groups.google.com/group/jquery-dev/browse_thread/thread/10fa400d3f9d9521/ )
             *
             * Dual licensed under the MIT and GPL licenses:
             *   http://www.opensource.org/licenses/mit-license.php
             *   http://www.gnu.org/licenses/gpl.html
             */
            var offsetMethod = $.fn.offset;
            $.fn.offset = function () {
                var offset = offsetMethod.call(this),
                    bottom = (offset) ? offset.top + this.outerHeight():0,
                    right = (offset) ? offset.left + this.outerWidth():0,
                    a = arguments;
                return (a.length) ? this.animate({
                                                 top  : a[0].top  || a[0],
                                                 left : a[0].left || a[1]
                                                 }, (a[0].top ? a[1] : a[2]) || 1)
                                  : $.extend(offset, {
                                                     bottom: bottom,
                                                     right: right
                                                     });
            };
        }
        //end function plugin_jquery_enhancedOffset

        function plugin_jquery_antWidgetSummary($){
            /*
             * jQuery Plugin by antenna.is
             * builds the antenna widget's summary widget.
             * accepts settings to customize the format
             */

            $.fn.antWidgetSummary = function( params ) {
                //jQuery plugin pattern :http://docs.jquery.com/Plugins/Authoring
                if ( methods[params] ) {
                    return methods[params].apply( this, Array.prototype.slice.call( arguments, 1 ));
                } else if ( typeof params === 'object' || ! params ) {
                    return methods.init.apply( this, arguments );
                } else {
                    $.error( 'Method ' +  params + ' does not exist.' );
                }
            };

            var defaults = {
            };

            var methods = {
                init: function( options ) {
                    var $this = ( this[0] === document ) ? $('.ant-summary') : this,
                        settings;
                    return $this.each(function(){


                        // merge default and user parameters
                        settings = options ? $.extend({}, defaults, options) : defaults;
                        settings.parentContainer = this;

                        //temp quick fix

                        $(this).data('settings', settings);
                        _makeSummaryWidget(settings);
                    });
                },
                update: function(){
                    var $this = ( this[0] === document ) ? $('.ant-summary') : this;

                    return $this.each(function(index){
                        
                        //grab the basic setting just from the data 
                        var settings = $(this).data('settings');

                        var pageId = (typeof settings != 'undefined') ? settings.id : ANT.util.getPageProperty('id');

                        //get the latest page data
                        settings.summary = ANT.pages[pageId].summary;
                        _makeSummaryWidget(settings);
                    });
                }


            };
            //end methods

            //helper function for ajax above
            function _makeSummaryWidget(settings){


            // DEBUG
            // ANT.group.summary_widget_expanded_mobile = true;

                if (ANT.status.page === true && ANT.group.summary_widget_selector!='none') {
                    var page = settings;
                    
                    var widgetClass = 'ant-summary-key-'+page.key;

                    //first kill any existing instances; we're going to recreate them.
                    $('.'+widgetClass).remove();

                    var $summary_widget_parent = $(page.parentContainer),
                        $summary_widget = $('<div class="ant ant-summary ant-summary-'+page.id+' ant-border-box" ant-page-id="'+page.id+'"></div>').addClass(widgetClass);

                    if ( ANT.engageScriptParams.bookmarklet == "true" ) {
                        $summary_widget.addClass('ant_bookmarklet');
                    }
                    $summary_widget.data({
                        page_id:page.id,
                        page_key:page.key
                    });

                    var summaryWidgetInsertionMethod = ( ANT.group.summary_widget_method != "" ) ? ANT.group.summary_widget_method : "after";

                    //page.jqFunc would be something like 'append' or 'after',
                    //so this would read $summary_widget_parent.append($summary_widget);
                    $summary_widget_parent[ summaryWidgetInsertionMethod ]($summary_widget);

                    var placement = ($summary_widget_parent.hasClass('defaultSummaryBar')) ? "top":"top";
                    $summary_widget.find('img.ant_tooltip_this').tooltip({placement:placement});

                    // if (ANT.group.summary_widget_expanded_mobile === true) {
                    //     $summary_widget.append(
                    //         '<div class="ant-top-tags"><div class="ant-top-tags-wrapper">' +
                    //         '<a href="javascript:void(0);" class="ant-top-tag">Hilarious (12)</a> <a href="javascript:void(0);" class="ant-top-tag">What the what (10)</a> <a href="javascript:void(0);" class="ant-top-tag">Hilarious (12)</a> <a href="javascript:void(0);" class="ant-top-tag">What the what (10)</a>' +
                    //         '</div></div>'
                    //     );
                    // }

                    $summary_widget.append(
                        '<a href="javascript:void(0);" target="_blank" class="ant_logo">'+
                        // '<a href="'+ANT_baseUrl+'" target="_blank" class="ant_logo">'+
                            '<span class="ant-antenna-logo"></span>'+
                            // '<span class="no-ant ant-logo" title="This is <strong style=\'color:#4d92da;\'>Antenna</strong>. Click to visit our site and learn more!" src="'+ANT_staticUrl+'widget/images/blank.png" ></span>'+
                        '</a>'
                    );

                    // $summary_widget.find('.ant-logo').click( function() {
                        // ANT.events.track('click_ant_icon_summ');
                    // });

                    $summary_widget.find('.ant-logo').tooltip({});

                    var onActiveEvent = function(){
                        // let's get the reaction summaries for the page here.
                        getReactedContent();
                        var page_id = $(this).data('page_id');

                        var $aWindow = ANT.aWindow.make( "readMode", {is_page:true, page:page, tags:page.toptags} );

                        ANT.events.trackEventToCloud({
                            event_type: 'sb',
                            event_value: (page.toptags.length>0) ? 'vw':'ad',  // view or react
                            page_id: page_id
                        });
                        ANT.events.emit('antenna.reactionview', '', { 'kind':'page' });
                    };

                    if(isTouchBrowser){
                        $summary_widget.on('touchend.ant', function(e){
                            // if (ANT.util.bubblingEvents['dragging'] == true ) { return; }
                            if ( ANT.util.isTouchDragging(e) ) { return; }
                            if (ANT.util.bubblingEvents['touchend'] == false) {
                                onActiveEvent.call(this);
                                $(this).toggleClass('ant_hover');
                            }
                        });
                    }else{
                        $summary_widget.hover(
                            onActiveEvent,
                            function() {
                            }
                        );
                    }

                    //quick fix - I don't know if settings.summary.where(kind =="tag").count is reliable.
                    var trueTotal;
                    if(settings.summary){
                        $.each(settings.summary, function(){
                            if(this.kind == "tag"){
                                trueTotal = this.count;
                            }
                        });
                    }

                    var total_reactions = 0;
                    if(trueTotal){
                        total_reactions = trueTotal;
                    }else{
                        $.each( page.toptags, function(idx, tag) {
                            total_reactions +=  tag.tag_count;
                        });
                    }

                    var total_reactions_label = ( total_reactions > 1 ) ?
                        total_reactions+" " + '<span>'+ANT.t('plural_reaction')+'</span>' :
                            ( total_reactions > 0 ) ? 
                                total_reactions+" " + '<span>'+ANT.t('single_reaction')+'</span>' :
                                '<span>'+ANT.t('plural_reaction')+'</span>';
                    $summary_widget.append(
                        '<a class="ant_reactions_label">'+total_reactions_label+'</a>'
                    );

                    // var bgColorRGB0 = ( ANT.util.hexToRgb( ANT.group.tag_box_bg_colors[0] ) ) ? ANT.util.hexToRgb( ANT.group.tag_box_bg_colors[0] ) : ANT.group.tag_box_bg_colors[0];
                    // var textColorRGB0 = ( ANT.util.hexToRgb( ANT.group.tag_box_text_colors[0] ) ) ? ANT.util.hexToRgb( ANT.group.tag_box_text_colors[0] ) : ANT.group.tag_box_text_colors[0];
                    // var bgColorRGB1 = ( ANT.util.hexToRgb( ANT.group.tag_box_bg_colors[1] ) ) ? ANT.util.hexToRgb( ANT.group.tag_box_bg_colors[1] ) : ANT.group.tag_box_bg_colors[1];
                    // var textColorRGB1 = ( ANT.util.hexToRgb( ANT.group.tag_box_text_colors[1] ) ) ? ANT.util.hexToRgb( ANT.group.tag_box_text_colors[1] ) : ANT.group.tag_box_text_colors[1];

                    var topReactions = [],
                        topReactionsLimit = (page&&page.toptags&&page.toptags.length===1) ? 1:2;

                        for (var j=0; j < page.toptags.length; j++ ) {
                            var currentTopReaction = page.toptags[j];

                            if ( currentTopReaction ) {
                                for (var k=0; k < ANT.group.default_reactions.length; k++ ) {
                                    var currentDefault = ANT.group.default_reactions[k];

                                    if ( currentTopReaction.id === currentDefault.id && topReactions.length < topReactionsLimit ) {
                                        topReactions.push( currentTopReaction );
                                    }
                                }
                            }
                        }

                    if (isMobile && ANT.group.summary_widget_expanded_mobile === true && topReactions.length >= 1) {
                        $summary_widget.append(
                            '<div class="ant-top-tags"><div class="ant-top-tags-wrapper">' +
                            ( topReactions[0] ? '<div class="ant-top-tag">'+topReactions[0].body+' <span>('+topReactions[0].tag_count+')</span></div>' : '' ) +
                            ( topReactions[1] ? '<div class="ant-top-tag">'+topReactions[1].body+' <span>('+topReactions[1].tag_count+')</span></div>' : '' ) +
                            '</div></div>'
                        );
                    }
                }
                
            }

            function getReactedContent( counts ) {            
                // get all of the content_nodes for this page
                // may want to limit this on back-end by a date range
                if ( typeof ANT.interaction_data == "undefined" ) {
                    ANT.interaction_data = {};
                }
                
                $.each( ANT.summaries, function(hash, summary) {
                    $.each( summary.top_interactions.tags, function(tag_id,interaction) {
                        if (typeof interaction != "undefined" ) {
                            if ( typeof ANT.summaries[ hash ].content_nodes != "undefined") {
                                ANT.util.buildInteractionData();
                            } else {
                                ANT.actions.content_nodes.init( hash, function() {
                                    ANT.util.buildInteractionData();
                                });
                            }
                        }
                    });
                });
            } // getReactedContent


        }
        //end function plugin_jquery_antWidgetSummary

        function plugin_jquery_selectionographer($, rangy){
            /*
             * jquery.selectionographer.js
             * $.fn.selog aliases to $.fn.selectionographer
             * author: eric@antenna.is
             * see docs for more info /docs/selectionographer-docs.js
             *
             * depends on all of the rangy pacakge:
             * rangy-core.js
             * rangy-cssclassapplier.js
             * rangy-selectionsaverestore.js
             * rangy-serializer.js
             *
             * expects params of ( $, rangy ) where $ is the jQuery alias
             *
             * //temp antenna note: to test in the live page, don't forget to use $A(), not $().
            */
            $.fn.selectionographer = function( params ) {
                //jQuery plugin pattern :http://docs.jquery.com/Plugins/Authoring
                if ( methods[params] ) {
                    return methods[params].apply( this, Array.prototype.slice.call( arguments, 1 ));
                } else if ( typeof params === 'object' || ! params ) {
                    return methods.init.apply( this, arguments );
                } else {
                    $.error( 'Method ' +  params + ' does not exist.' );
                }
            };
            $.fn.selog = $.fn.selectionographer;

            var defaults = {};

            var methods = {
                //note: In these methods, 'this' is the jQuery object that the plugin was invoked on. See plugin pattern above.
                init : function( options ) {
                    var $this = this;
                    options = options || {};

                    //todo: make _settings an object unique to each 'this';
                    return $this.each(function(){
                        // merge default and user parameters
                        _settings = $.extend(defaults, options);
                    });
                },
                save: function(selStateOrPartial){
                    // selStateOrPartial is an optional object.
                    // If selStateOrPartial is a full selState, or has a range, or a serialRange, it will clone it and save a new one.
                    // If it is omited or if both selStateOrPartial.range and selStateOrPartial.serialRange are ommited,
                    // it will use the current selection to build the selState.  If nothing is selected it returns false;
                    var $this = this,
                    selStateStack = _selStateStack,
                    state = selStateOrPartial || {},
                    selState;

                    //only take the first container for now
                    //todo: solution for multiple $objects?
                    state.container = state.container || $this[0] || document;
                    selState = _makeSelState( state );
                    //make sure selState didn't fail (i.e. if it was an empty range)
                    if(!selState) return false;

                    //push selState into stack
                    selStateStack[selState.idx] = selState;

                    return selState;
                },
                selectEl: function(el){
                    var range = rangy.createRange();
                    range.selectNodeContents(el);
                    var sel = rangy.getSelection();
                    sel.setSingleRange(range);
                },
                activate: function(idxOrSelState){
                    var selState = _fetchselState(idxOrSelState);
                    if(!selState) return false;
                    methods.clear();
                    _WSO().setSingleRange( selState.range );

                    return selState;
                },
                clear: function(){
                    _WSO().removeAllRanges();
                },
                modify: function(idxOrSelState, filterList) {
                    //let filterList be optionally called without idxOrSelState - letting the selState default to the latest.
                    if( idxOrSelState instanceof Array ){
                        filterList = idxOrSelState;
                        idxOrSelState = undefined; //will trigger default latest idx
                    }
                    var iniSelState = _fetchselState(idxOrSelState),
                    newSettings, newRange,
                    newSelState;

                    if(!iniSelState) return false;

                    //todo: it looks like the rangy method cloneRange breaks the ability to re-activate it later?
                    //we shouldn't need that though, anyway, but maybe it will get fixed down the line.
                    newRange = iniSelState.range.cloneRange();
                    //filter the ranges
                    newRange = _filter(newRange, filterList);
                    newSettings = {
                        range:newRange,
                        container:iniSelState.container
                    };
                    newSelState = methods.save( newSettings );
                    return newSelState;
                },
                hilite: function(idxOrSelState, switchOnOffToggleParam){
                    // switchOnOffToggle is optional.  Expects a string 'on', 'off', or 'toggle', or defaults to 'on'
                    // check if idxOrSelState is omited
                    var switchOnOffToggle = switchOnOffToggleParam;
                    if( typeof idxOrSelState === 'string' && isNaN( idxOrSelState ) ){
                        switchOnOffToggle = idxOrSelState;
                        idxOrSelState = undefined;
                    }
                    switchOnOffToggle = switchOnOffToggle || 'on';

                    //todo:checkout why first range is picking up new selState range (not a big deal)
                    var selState = _fetchselState(idxOrSelState);
                    if(!selState){
                        return false;
                    }

                    //extra protection against hiliting a ndoe with an invalid serialRange - flagged as false (not just undefined)
                    if( typeof selState.serialRange !== "undefined" && selState.serialRange === false ){
                        return false;
                    }

                    //todo: not using this yet..
                    /*
                    var range = selState.range;
                    var host = range.commonAncestorContainer;
                    //get the closest parent that isn't a textNode or CDATA node
                    while( host.nodeType == 3 || host.nodeType == 4 ){ //Node.TEXT_NODE equals 3, CDATA_SECTION_NODE = 4
                        host = host.parentNode;
                    }
                    */

                    //switch the hilite state
                    _hiliteSwitch(selState, switchOnOffToggle);
                    return selState;
                },
                helpers: function(helperPack){
                    var func = _helperPacks[helperPack];
                    return func ? func.apply( this, Array.prototype.slice.call( arguments, 1 ) ) : false;
                },
                find: function(string){
                    var re = [],
                    $this = this,
                    regex;

                    if( !string ) return false;

                    /*
                    function escapeRegEx( str ) {
                        // http://kevin.vanzonneveld.net
                        return (str+'').replace(/(\\)/g, "\\$1");
                    }
                    */

                    //todo: verify that this is best practice
                    //http://simonwillison.net/2006/Jan/20/escape/
                    RegExp.escape = function(text) {
                        return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
                    };

                    /*
                    //if a single string, make it an array.
                    if (typeof strings === "string"){
                        strings = [strings];
                    }
                    */

                    /*
                    var re = [], regex, scope=this;
                    $.each(strings,function(i,str){
                        if ( str === "") return;
                        str = scope.escapeRegEx(n);
                        re.push(str);
                    });
                    regex = re.join("|"); //or
                    regex = '(?:'+regex+')';
                    */

                    string = RegExp.escape(string);
                    regex = new RegExp(string, "gim");

                    return $this.each(function(){
                        var text = $(this).text(),
                        match = 0,
                        check = 0, //while testing, avoid infiniteloops
                        ret = [];
                        while( (match = regex.exec(text)) && check < 5 ) {
                            ret.push(match.index);
                            check++;
                        }

                        return ret;
                    });
                },
                stack: function(){
                   return _selStateStack;
                },
                //prob wont use this
                data: function(name){
                   return _data[name];
                }
            };

            //private objects
            var _settings = {}, //set on init
            //for all helperPacks, 'this' is passed in with apply.
            _helperPacks = {
                smartHilite: function(){
                    return methods.hilite( methods.modify( methods.save.apply(this) ) ); //oooh lispy.
                },
                activateRange: function(rangeOrSerialRange){
                    //todo: not using this anyway, but not sure if this still works completely..
                    var settings = {};
                    if (!rangeOrSerialRange) return false;
                    if( typeof rangeOrSerialRange === "string" ){
                        //assume it's a serialRange
                        settings.serialRange = rangeOrSerialRange;
                    }
                    else{
                        //assume it's a range
                        settings.range = rangeOrSerialRange;
                    }
                    return methods.activate( methods.save(settings) );
                }
            },
            _selStateStack = [
            /*
                //keep commented out:
                //Example template: Set by save and added to the stack.
                 {
                    todo: update this is old...

                    selection: selectionObj || rangy.getSelection(),
                    idx: selStateStack.length,
                    timestamp: $.now(),
                    revisionParent: null, //set below
                    ranges: null,       //set below
                    text: ""            //set below
                }
            */
            ],
            _modifierFilters = {
                filterOutANTIndicator: function(range, params){
                    //check if $indicator is contained in the range, and if so, move the range's end to just before it.

                    var commonAncestorContainer = range.commonAncestorContainer;
                    var $indicator = $(commonAncestorContainer).find('.ant_indicator');
                    if($indicator.length){
                        var inTheRange = range.containsNode($indicator[0], true); //2nd param is 'partial': (rangy docs for containsNode)
                        if(inTheRange){
                            range.setEndBefore( $indicator[0] );
                        }
                    }
                    return range;
                },
                stripWhiteSpace: function(range){
                    // this function breaks stuff
                    return range;

                    var rangeStr = range.toString(),
                    s = {}, //start
                    e = {}; //end
                    //see rangy core for range attributes used here
                    s.textnode = range.startContainer;
                    s.offset = range.startOffset;
                    s.regx = /^\s+/; //start, then one or more whitespace chars
                    s.result = s.regx.exec(rangeStr);

                    e.textnode = range.endContainer;
                    e.offset = range.endOffset;
                    e.regx = /\s+$/; //one or more whitespace chars, then end
                    e.result = e.regx.exec(rangeStr);

                    //change the range offsets by the length of the whitespace found
                    if(s.result){
                        s.resultStrLen = s.result[0].length;
                        _rangeOffSet( range, {relOffset: (s.resultStrLen)} );
                    }
                    if(e.result){
                        e.resultStrLen = e.result[0].length;
                        _rangeOffSet( range, {relOffset: (-e.resultStrLen), start:false} );
                    }
                    return range;
                },
                firstWordSnap: function(range){
                    //find the extra word characters the range cut off at the beginning of the selState, and add em'.
                    //and change the offset of the range
                    var textnode = range.startContainer, //rangy attribute startContainer
                    startOffset = range.startOffset,
                    testRange;
                    if (startOffset === 0) return range;
                    //else

                    //NOTE: this assumes that the function and the range share the same document - change if we ever need to call between iframes.
                    //create a helper object to find the word boundary
                    var hlpr = {
                        range: rangy.createRange() //rangy function createRange
                    };
                    hlpr.range.setStart(textnode, 0);
                    hlpr.range.setEnd(textnode, startOffset);
                    hlpr.str0 = (hlpr.range.toString());
                    //zero or more whitespace chars, then one ore more non-whitespace chars, then the end.
                    hlpr.regx1 = /\s*\S+$/;
                    hlpr.result1 = hlpr.regx1.exec(hlpr.str0);
                    if (hlpr.result1 === null) return range;
                    //else

                    hlpr.str1 = hlpr.result1[0]; //result[0] is string representation of regex object - see exec() for info
                    //strip any white space off beginning of string
                    hlpr.str2 = hlpr.str1.replace(/\s*/,"");
                    hlpr.extraWordChars = hlpr.str2.length;
                    _rangeOffSet(range, {relOffset: (-hlpr.extraWordChars) });
                    return range;
                },
                lastWordSnap: function(range){
                    //find the extra word characters the range cut off at the end of the selState, and add em'.
                    var textnode = range.endContainer, //rangy attribute endContainer
                    endOffset = range.endOffset,
                    testRange;
                    if (endOffset === 0) return range;
                    //else

                    //NOTE: this assumes that the function and the range share the same document - change if we ever need to call between iframes.
                    //create a tester object to find the word boundary
                    var hlpr = {
                        range: rangy.createRange() //rangy function createRange
                    };
                    hlpr.range.setStart(textnode, endOffset);
                    hlpr.range.setEnd(textnode, textnode.length);
                    hlpr.str0 = (hlpr.range.toString());
                    //zero or more whitespace chars, then one ore more non-whitespace chars, then the end.
                    hlpr.regx1 = /^\S+(?=(\s|$))/;
                    hlpr.result1 = hlpr.regx1.exec(hlpr.str0);
                    if (hlpr.result1 === null) return range;
                    //else

                    hlpr.str1 = hlpr.result1[0]; //result[0] is string representation of regex object - see exec() for info
                    hlpr.extraWordChars = hlpr.str1.length;
                    _rangeOffSet(range, {relOffset: (hlpr.extraWordChars), start:false});
                    return range;
                }
            },
            //prob won't use this.
            _data = {
                stack: _selStateStack
            };

            //private functions:
            function _WSO(){
                return rangy.getSelection();
            }
            function _makeSelState(settings){
                var scope = this,
                selStateStack = _selStateStack,
                range, serialRange,
                theSettings = settings || {},
                defaults = {
                    styleName: 'ant_hilite',
                    container: document,        // likely passed in by save()
                    serialRange: null,          // set below - overwritten by explicit range object
                    range: null                 // set below - overwrites serial range
                },
                overrides = {
                    idx: selStateStack.length,  // can't overide
                    timestamp: $.now(),         // don't really need this..
                    interactionID: null,        // for later use
                    hiliter: null,              // set below
                    revisionParent: null,       // set below
                    text: ""                    // set below
                },
                selState = $.extend({}, defaults, theSettings, overrides);

                //set properties that depend on the others already being initiated

                // if missing param or missing needed range data
                if( !selState.range && !selState.serialRange ){
                    //try getting data from browser selection
                    var WSO = _WSO();
                    if(WSO.isCollapsed) return false;
                    //else
                    range = WSO.getRangeAt(0);
                    //serializing relative to the parent container. The false is omitChecksum=false.
                    try{
                        serialRange = rangy.serializeRange(range, true, selState.container ); //see rangy function serializeRange
                    } catch(e) {
                        serialRange = false;
                    }
                }
                else if(selState.range){
                    range = selState.range;
                    try{
                        serialRange = rangy.serializeRange(range, true, selState.container ); //see rangy function serializeRange
                        //using the name e2 because jslint says use a new name here: http://stackoverflow.com/questions/6100230/javascript-catch-parameter-already-defined
                    } catch(e2) {
                        serialRange = false;
                    }
                }
                else if(selState.serialRange){
                    serialRange = selState.serialRange;
                    range = rangy.deserializeRange(serialRange, selState.container ); //see rangy function deserializeRange
                }
                else{
                }
                selState.serialRange = serialRange;
                //todo: low: could think more about when to cloneRange to make it a tiny bit more efficient.
                selState.range = range.cloneRange();
                selState.text = selState.range.toString(); //rangy range toString function
                //check for empty selection..
                if(selState.text.length === 0) return false;
                //set hiliter - depends on idx, range, etc. being set already.
                selState.hiliter = _hiliteInit(selState);

                return selState;
            }
            function _fetchselState(idxOrSelState){
                //check if idxOrSelState is selState false (error signal from up the chain - return false),
                //else, if object, it's a selState,
                //else, get the selState from idx,
                //else if param is undefined, return the latest on the stack

                if( idxOrSelState === false ) return false;

                if(typeof idxOrSelState === 'object') return idxOrSelState;

                var selStateStack = _selStateStack,
                //set idx to declared idx, else last idx on the stack
                idx = (typeof idxOrSelState == "string" || typeof idxOrSelState == "number" ) ? idxOrSelState : selStateStack.length-1,
                selState = selStateStack[idx];
                if(selState)
                    return selState;

                //else
                return false;
            }
            function _hiliteInit(selState){
                //only init once
                if(selState.hiliter){
                    return selState.hiliter;
                }
                // todo: make hiliter a proper js class object
                var range = selState.range,
                styleClass = selState.styleName,
                hiliter;


                //use a unique indexed version of style to uniquely identify spans
                var uniqueClass = styleClass + "_" + selState.idx;
                //methods.clear();
                hiliter = rangy.createCssClassApplier( uniqueClass, true ); //see rangy docs for details
                hiliter['class'] = uniqueClass;
                hiliter['get$start'] = function(){
                    return $(range.startContainer).closest('.'+hiliter['class']);
                };
                hiliter['get$end'] = function(){
                    return $(range.endContainer).closest('.'+hiliter['class']);
                };
                hiliter['isActive'] = function(){
                    var isActive = false;
                    try{
                        isActive = hiliter['isAppliedToRange'](range);
                    }
                    catch(e){
                        //to signal there was an error;
                        isActive = null;
                    }

                    return isActive;
                };

                return hiliter;
            }
            function _hiliteSwitch(selState, switchOnOffToggle) {

                // it looks like the rangy cssClassApplier is still buggy.  Keep this commented out for a while and see how things go.

                //args required
                //switchOnOffToggle must be a string 'on','off',or 'toggle'
                var range = selState.range,
                styleClass = selState.styleName,
                hiliter = selState.hiliter,
                isActive = hiliter['isActive']();
                if(isActive == null){
                    //null signals an error- range was no longer valid for some reason.  Just return.
                    return;
                }
                //methods.clear();

                if( !isActive && (switchOnOffToggle === "on" || switchOnOffToggle === "toggle" )){
                    //turn on
                    //log('adding hilite for selState ' + selState.idx + ': ' + selState.text ) //selog temp logging
                    hiliter.applyToRange(range);
                    //log('trying to apply range:  ' +range )
                    //apply the visual styles with the generic classes
                    $('.'+hiliter['class']).addClass('ant_hilite '+styleClass);
                    //apply css classes to start and end so we can style those specially
                    hiliter['get$start']().addClass(styleClass+'_start');
                    hiliter['get$end']().addClass(styleClass+'_end');

                    //clear the selection
                    methods.clear();

                }else if( isActive && (switchOnOffToggle === "off" || switchOnOffToggle === "toggle" )){
                    //turn off
                    //log('removing hilite for selState ' + selState.idx + ': ' + selState.text ) //selog temp logging
                    //remove the classes again so that the hiliter can normalize the selection (paste it back together)
                    //log('trying to remove range:  ' +range )
                    hiliter['get$start']().removeClass(styleClass+'_start');
                    hiliter['get$end']().removeClass(styleClass+'_end');
                    $('.'+hiliter['class']).removeClass(styleClass);

                    //do one more check even though we shouldn't have to.
                    if(hiliter.isAppliedToRange(range)){
                        hiliter.undoToRange(range);
                    }
                    else{
                    }
                }

                return selState;
            }
            function _rangeOffSet(range, optsParam){
                // returns a range or false, which should trigger the caller to fail gracefully.
                var defaults = {
                    start: true, //start or end offset?
                    offset: undefined, // absolute offset should be a positive or negative number to add to the offset
                    relOffset: undefined // (relative offset) is ignored if offset is set
                },
                opts = $.extend({}, defaults, optsParam),
                iniOffset = (opts.start) ? range.startOffset : range.endOffset; //rangy range properties startOffset, endOffset
                if(typeof opts.offset === "undefined" ){
                    if(typeof opts.relOffset === "undefined" ){
                        return iniOffset;
                    }//else
                    opts.offset = iniOffset + opts.relOffset;
                }
                try{
                    if(opts.start){
                        range.setStart(range.startContainer, opts.offset); //rangy function setStart, attribute startContainer
                    }else{
                        range.setEnd(range.endContainer, opts.offset); //rangy function setEnd, attribute endContainer
                    }
                    return range;
                }catch(e){
                    return false;
                }
            }
            function _filter(range, filterList){
                // I think only firefox allows for multiple ranges to be selected, and no one really does it.
                // Besides, for our tool, we'd prob have to just use the first one anyway..
                // For now, just use only the first range on the rare case where someone tries to pass more than 1. (ranges[0])

                //filterList should be a filter-name string or an arr of filters,
                // which in turn are either a filter-name string or an arr: [filterNameStr, params.,.,. ];
                //todo: this syntax is a liiiiittle bit crazy.

                var scope = this,
                filters = _modifierFilters, //make default all filters
                //defaultFilters = ['stripWhiteSpace', 'firstWordSnap', 'lastWordSnap'],
                doFilters = {};  //will be {filter:paramList}

                //if filters not specifed, call all filters
                if ( typeof filterList === "undefined" || filterList === null ){
                    $.each(filters, function(funcName, func){
                        doFilters[funcName] = [];
                    });
                }
                else if ( typeof filterList === "string" ){
                    doFilters[filterList] = [];
                }
                else{
                    //todo: combine with above with a recurse call instead?
                    $.each(filterList, function(idx, func){
                        if ( typeof func === "string" ){
                            doFilters[func] = [];
                        }else{
                            //func is an arr
                            var funcName = func[0];
                            var params = (func.length > 1) ? func.slice(1) : [];
                            doFilters[funcName] = params;
                        }

                    });
                }
                $.each(doFilters, function(funcName, params){
                    var filterFunc = filters[ funcName ] || function(){
                    };
                    //finally, run em'.
                    range = filterFunc(range, params);
                });
                return range;
            }

            //end private functions

            //init selog on window.
            $(document).selog();

        }
        //end function plugin_jquery_selectionographer

        function plugin_jquery_mustache(jQuery){
            var $ = jQuery;
            //this was causing errors when define.amd was defined on a bookmark site.  Override locally here.
            var define = undefined;
            (function(a){(function(a,b){"object"==typeof exports&&exports?module.exports=b:"function"==typeof define&&define.amd?define(b):a.Mustache=b})(this,function(){function j(a,b){return h.call(a,b)}function k(a){return!j(d,a)}function m(a){return a.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g,"\\$&")}function o(a){return(a+"").replace(/[&<>"'\/]/g,function(a){return n[a]})}function p(a){this.string=a,this.tail=a,this.pos=0}function q(a,b){this.view=a,this.parent=b,this._cache={}}function r(){this.clearCache()}function s(b,c,d,e){for(var g,h,i,f="",j=0,k=b.length;k>j;++j)switch(g=b[j],h=g[1],g[0]){case"#":if(i=d.lookup(h),"object"==typeof i)if(l(i))for(var m=0,n=i.length;n>m;++m)f+=s(g[4],c,d.push(i[m]),e);else i&&(f+=s(g[4],c,d.push(i),e));else if("function"==typeof i){var o=null==e?null:e.slice(g[3],g[5]);i=i.call(d.view,o,function(a){return c.render(a,d)}),null!=i&&(f+=i)}else i&&(f+=s(g[4],c,d,e));break;case"^":i=d.lookup(h),(!i||l(i)&&0===i.length)&&(f+=s(g[4],c,d,e));break;case">":i=c.getPartial(h),"function"==typeof i&&(f+=i(d));break;case"&":i=d.lookup(h),null!=i&&(f+=i);break;case"name":i=d.lookup(h),null!=i&&(f+=a.escape(i));break;case"text":f+=h}return f}function t(a){for(var e,b=[],c=b,d=[],f=0,g=a.length;g>f;++f)switch(e=a[f],e[0]){case"#":case"^":d.push(e),c.push(e),c=e[4]=[];break;case"/":var h=d.pop();h[5]=e[2],c=d.length>0?d[d.length-1][4]:b;break;default:c.push(e)}return b}function u(a){for(var c,d,b=[],e=0,f=a.length;f>e;++e)c=a[e],c&&("text"===c[0]&&d&&"text"===d[0]?(d[1]+=c[1],d[3]=c[3]):(d=c,b.push(c)));return b}function v(a){return[RegExp(m(a[0])+"\\s*"),RegExp("\\s*"+m(a[1]))]}var a={};a.name="mustache.js",a.version="0.7.2",a.tags=["{{","}}"],a.Scanner=p,a.Context=q,a.Writer=r;var b=/\s*/,c=/\s+/,d=/\S/,e=/\s*=/,f=/\s*\}/,g=/#|\^|\/|>|\{|&|=|!/,h=RegExp.prototype.test,i=Object.prototype.toString,l=Array.isArray||function(a){return"[object Array]"===i.call(a)},n={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;","/":"&#x2F;"};a.escape=o,p.prototype.eos=function(){return""===this.tail},p.prototype.scan=function(a){var b=this.tail.match(a);return b&&0===b.index?(this.tail=this.tail.substring(b[0].length),this.pos+=b[0].length,b[0]):""},p.prototype.scanUntil=function(a){var b,c=this.tail.search(a);switch(c){case-1:b=this.tail,this.pos+=this.tail.length,this.tail="";break;case 0:b="";break;default:b=this.tail.substring(0,c),this.tail=this.tail.substring(c),this.pos+=c}return b},q.make=function(a){return a instanceof q?a:new q(a)},q.prototype.push=function(a){return new q(a,this)},q.prototype.lookup=function(a){var b=this._cache[a];if(!b){if("."==a)b=this.view;else for(var c=this;c;){if(a.indexOf(".")>0){b=c.view;for(var d=a.split("."),e=0;b&&d.length>e;)b=b[d[e++]]}else b=c.view[a];if(null!=b)break;c=c.parent}this._cache[a]=b}return"function"==typeof b&&(b=b.call(this.view)),b},r.prototype.clearCache=function(){this._cache={},this._partialCache={}},r.prototype.compile=function(b,c){var d=this._cache[b];if(!d){var e=a.parse(b,c);d=this._cache[b]=this.compileTokens(e,b)}return d},r.prototype.compilePartial=function(a,b,c){var d=this.compile(b,c);return this._partialCache[a]=d,d},r.prototype.getPartial=function(a){return a in this._partialCache||!this._loadPartial||this.compilePartial(a,this._loadPartial(a)),this._partialCache[a]},r.prototype.compileTokens=function(a,b){var c=this;return function(d,e){if(e)if("function"==typeof e)c._loadPartial=e;else for(var f in e)c.compilePartial(f,e[f]);return s(a,c,q.make(d),b)}},r.prototype.render=function(a,b,c){return this.compile(a)(b,c)},a.parse=function(d,h){function s(){if(q&&!r)for(;o.length;)delete n[o.pop()];else o=[];q=!1,r=!1}if(d=d||"",h=h||a.tags,"string"==typeof h&&(h=h.split(c)),2!==h.length)throw Error("Invalid tags: "+h.join(", "));for(var w,x,y,z,A,i=v(h),j=new p(d),l=[],n=[],o=[],q=!1,r=!1;!j.eos();){if(w=j.pos,y=j.scanUntil(i[0]))for(var B=0,C=y.length;C>B;++B)z=y.charAt(B),k(z)?o.push(n.length):r=!0,n.push(["text",z,w,w+1]),w+=1,"\n"==z&&s();if(!j.scan(i[0]))break;if(q=!0,x=j.scan(g)||"name",j.scan(b),"="===x?(y=j.scanUntil(e),j.scan(e),j.scanUntil(i[1])):"{"===x?(y=j.scanUntil(RegExp("\\s*"+m("}"+h[1]))),j.scan(f),j.scanUntil(i[1]),x="&"):y=j.scanUntil(i[1]),!j.scan(i[1]))throw Error("Unclosed tag at "+j.pos);if(A=[x,y,w,j.pos],n.push(A),"#"===x||"^"===x)l.push(A);else if("/"===x){if(0===l.length)throw Error('Unopened section "'+y+'" at '+w);var D=l.pop();if(D[1]!==y)throw Error('Unclosed section "'+D[1]+'" at '+w)}else if("name"===x||"{"===x||"&"===x)r=!0;else if("="===x){if(h=y.split(c),2!==h.length)throw Error("Invalid tags at "+w+": "+h.join(", "));i=v(h)}}var D=l.pop();if(D)throw Error('Unclosed section "'+D[1]+'" at '+j.pos);return n=u(n),t(n)};var w=new r;return a.clearCache=function(){return w.clearCache()},a.compile=function(a,b){return w.compile(a,b)},a.compilePartial=function(a,b,c){return w.compilePartial(a,b,c)},a.compileTokens=function(a,b){return w.compileTokens(a,b)},a.render=function(a,b,c){return w.render(a,b,c)},a.to_html=function(b,c,d,e){var f=a.render(b,c,d);return"function"!=typeof e?f:(e(f),void 0)},a}()),a.mustache=function(a,b,c){return Mustache.render(a,b,c)},a.fn.mustache=function(b,c){return a(this).map(function(d,e){var f=a.trim(a(e).html()),g=a.mustache(f,b,c);return a(g).get()})}})(jQuery);
        }

        function plugin_jquery_improvedCSS($){
            //improvedCSS.js  http://plugins.jquery.com/node/8726/release
            /**
            * @Keith Bentrup
            */
            $.fn.css2 = $.fn.css;
            $.fn.css = function () {
                if (arguments.length) return $.fn.css2.apply(this,arguments);
                var attr = ['font-family','font-size','font-weight','font-style','color',
                  'text-transform','text-decoration','letter-spacing','word-spacing',
                  'lineHeight','text-align','vertical-align','direction','background-color',
                  'background-image','background-repeat','background-position',
                  'background-attachment','opacity','width','height','top','right','bottom',
                  'left','margin-top','margin-right','margin-bottom','margin-left',
                  'padding-top','padding-right','padding-bottom','padding-left',
                  'border-top-width','border-right-width','border-bottom-width',
                  'border-left-width','border-top-color','border-right-color',
                  'border-bottom-color','border-left-color','border-top-style',
                  'border-right-style','border-bottom-style','border-left-style','position',
                  'display','visibility','z-index','overflow-x','overflow-y','white-space',
                  'clip','float','clear','cursor','list-style-image','list-style-position',
                  'list-style-type','marker-offset'
                ];
                var len = attr.length, obj = {}, val;
                for (var i = 0; i < len; i++) {
                    //correct for ie
                    val = attr[i];


                    obj[val] = $.fn.css2.call(this, val);

                    if(val == "lineHeight"){
                        obj[val] = $.fn.css2.call(this, "auto");
                    }
                    val = (typeof val === "undefined") ? 'auto' :  val;
                }
                return obj;
            };
        }
        //end function plugin_jquery_improvedCSS

        function plugin_jquery_mousewheel($){
            /* 
              Copyright (c) 2011 Brandon Aaron (http://brandonaaron.net)
              Licensed under the MIT License (LICENSE.txt).

              Thanks to: http://adomas.org/javascript-mouse-wheel/ for some pointers.
              Thanks to: Mathias Bank(http://www.mathias-bank.de) for a scope bug fix.
              Thanks to: Seamus Leahy for adding deltaX and deltaY

              Version: 3.0.6

              Requires: 1.2.2+
             */
            var types=['DOMMouseScroll','mousewheel'];if($.event.fixHooks){for(var i=types.length;i;){$.event.fixHooks[types[--i]]=$.event.mouseHooks;}}
            $.event.special.mousewheel={setup:function(){if(this.addEventListener){for(var i=types.length;i;){this.addEventListener(types[--i],handler,false);}}else{this.onmousewheel=handler;}},teardown:function(){if(this.removeEventListener){for(var i=types.length;i;){this.removeEventListener(types[--i],handler,false);}}else{this.onmousewheel=null;}}};$.fn.extend({mousewheel:function(fn){return fn?this.bind("mousewheel",fn):this.trigger("mousewheel");},unmousewheel:function(fn){return this.unbind("mousewheel",fn);}});function handler(event){var orgEvent=event||window.event,args=[].slice.call(arguments,1),delta=0,returnValue=true,deltaX=0,deltaY=0;event=$.event.fix(orgEvent);event.type="mousewheel";if(orgEvent.wheelDelta){delta=orgEvent.wheelDelta/120;}
            if(orgEvent.detail){delta=-orgEvent.detail/3;}
            deltaY=delta;if(orgEvent.axis!==undefined&&orgEvent.axis===orgEvent.HORIZONTAL_AXIS){deltaY=0;deltaX=-1*delta;}
            if(orgEvent.wheelDeltaY!==undefined){deltaY=orgEvent.wheelDeltaY/120;}
            if(orgEvent.wheelDeltaX!==undefined){deltaX=-1*orgEvent.wheelDeltaX/120;}
            args.unshift(event,delta,deltaX,deltaY);return($.event.dispatch||$.event.handle).apply(this,args);}
        }
        //end function plugin_jquery_mousewheel

        function plugin_jquery_scrollStopStart(jQuery){
            /*!
             * jQuery Scrollstop Plugin v1.1.0
             * https://github.com/ssorallen/jquery-scrollstop
             */
            !function(a){var b=a.event.dispatch||a.event.handle,c=a.event.special,d="D"+ +new Date,e="D"+(+new Date+1);c.scrollstart={setup:function(e){var g,f=a.extend({latency:c.scrollstop.latency},e),h=function(a){var c=this,d=arguments;g?clearTimeout(g):(a.type="scrollstart",b.apply(c,d)),g=setTimeout(function(){g=null},f.latency)};a(this).bind("scroll",h).data(d,h)},teardown:function(){a(this).unbind("scroll",a(this).data(d))}},c.scrollstop={latency:250,setup:function(d){var g,f=a.extend({latency:c.scrollstop.latency},d),h=function(a){var c=this,d=arguments;g&&clearTimeout(g),g=setTimeout(function(){g=null,a.type="scrollstop",b.apply(c,d)},f.latency)};a(this).bind("scroll",h).data(e,h)},teardown:function(){a(this).unbind("scroll",a(this).data(e))}}}(jQuery);
        }

        function plugin_jquery_jScrollPane($){
            /*
             * jScrollPane - v2.0.0beta11 - 2011-05-02
             * http://jscrollpane.kelvinluck.com/
             *
             * Copyright (c) 2010 Kelvin Luck
             * Dual licensed under the MIT and GPL licenses.
             */

            //fix minifier quirks
            var b = $,
            a = window,
            c = undefined;

            b.fn.jScrollPane=function(e){function d(D,O){var az,Q=this,Y,ak,v,am,T,Z,y,q,aA,aF,av,i,I,h,j,aa,U,aq,X,t,A,ar,af,an,G,l,au,ay,x,aw,aI,f,L,aj=true,P=true,aH=false,k=false,ap=D.clone(false,false).empty(),ac=b.fn.mwheelIntent?"mwheelIntent.jsp":"mousewheel.jsp";aI=D.css("paddingTop")+" "+D.css("paddingRight")+" "+D.css("paddingBottom")+" "+D.css("paddingLeft");f=(parseInt(D.css("paddingLeft"),10)||0)+(parseInt(D.css("paddingRight"),10)||0);function at(aR){var aM,aO,aN,aK,aJ,aQ,aP=false,aL=false;az=aR;if(Y===c){aJ=D.scrollTop();aQ=D.scrollLeft();D.css({overflow:"hidden",padding:0});ak=D.innerWidth()+f;v=D.innerHeight();D.width(ak);Y=b('<div class="jspPane" />').css("padding",aI).append(D.children());am=b('<div class="jspContainer" />').css({width:ak+"px",height:v+"px"}).append(Y).appendTo(D)}else{D.css("width","");aP=az.stickToBottom&&K();aL=az.stickToRight&&B();aK=D.innerWidth()+f!=ak||D.outerHeight()!=v;if(aK){ak=D.innerWidth()+f;v=D.innerHeight();am.css({width:ak+"px",height:v+"px"})}if(!aK&&L==T&&Y.outerHeight()==Z){D.width(ak);return}L=T;Y.css("width","");D.width(ak);am.find(">.jspVerticalBar,>.jspHorizontalBar").remove().end()}Y.css("overflow","auto");if(aR.contentWidth){T=aR.contentWidth}else{T=Y[0].scrollWidth}Z=Y[0].scrollHeight;Y.css("overflow","");y=T/ak;q=Z/v;aA=q>1;aF=y>1;if(!(aF||aA)){D.removeClass("jspScrollable");Y.css({top:0,width:am.width()-f});n();E();R();w();ai()}else{D.addClass("jspScrollable");aM=az.maintainPosition&&(I||aa);if(aM){aO=aD();aN=aB()}aG();z();F();if(aM){N(aL?(T-ak):aO,false);M(aP?(Z-v):aN,false)}J();ag();ao();if(az.enableKeyboardNavigation){S()}if(az.clickOnTrack){p()}C();if(az.hijackInternalLinks){m()}}if(az.autoReinitialise&&!aw){aw=setInterval(function(){at(az)},az.autoReinitialiseDelay)}else{if(!az.autoReinitialise&&aw){clearInterval(aw)}}aJ&&D.scrollTop(0)&&M(aJ,false);aQ&&D.scrollLeft(0)&&N(aQ,false);D.trigger("jsp-initialised",[aF||aA])}function aG(){if(aA){am.append(b('<div class="jspVerticalBar" />').append(b('<div class="jspCap jspCapTop" />'),b('<div class="jspTrack" />').append(b('<div class="jspDrag" />').append(b('<div class="jspDragTop" />'),b('<div class="jspDragBottom" />'))),b('<div class="jspCap jspCapBottom" />')));U=am.find(">.jspVerticalBar");aq=U.find(">.jspTrack");av=aq.find(">.jspDrag");if(az.showArrows){ar=b('<a class="jspArrow jspArrowUp" />').bind("mousedown.jsp",aE(0,-1)).bind("click.jsp",aC);af=b('<a class="jspArrow jspArrowDown" />').bind("mousedown.jsp",aE(0,1)).bind("click.jsp",aC);if(az.arrowScrollOnHover){ar.bind("mouseover.jsp",aE(0,-1,ar));af.bind("mouseover.jsp",aE(0,1,af))}al(aq,az.verticalArrowPositions,ar,af)}t=v;am.find(">.jspVerticalBar>.jspCap:visible,>.jspVerticalBar>.jspArrow").each(function(){t-=b(this).outerHeight()});av.hover(function(){av.addClass("jspHover")},function(){av.removeClass("jspHover")}).bind("mousedown.jsp",function(aJ){b("html").bind("dragstart.jsp selectstart.jsp",aC);av.addClass("jspActive");var s=aJ.pageY-av.position().top;b("html").bind("mousemove.jsp",function(aK){V(aK.pageY-s,false)}).bind("mouseup.jsp mouseleave.jsp",ax);return false});o()}}function o(){aq.height(t+"px");I=0;X=az.verticalGutter+aq.outerWidth();Y.width(ak-X-f);try{if(U.position().left===0){Y.css("margin-left",X+"px")}}catch(s){}}function z(){if(aF){am.append(b('<div class="jspHorizontalBar" />').append(b('<div class="jspCap jspCapLeft" />'),b('<div class="jspTrack" />').append(b('<div class="jspDrag" />').append(b('<div class="jspDragLeft" />'),b('<div class="jspDragRight" />'))),b('<div class="jspCap jspCapRight" />')));an=am.find(">.jspHorizontalBar");G=an.find(">.jspTrack");h=G.find(">.jspDrag");if(az.showArrows){ay=b('<a class="jspArrow jspArrowLeft" />').bind("mousedown.jsp",aE(-1,0)).bind("click.jsp",aC);x=b('<a class="jspArrow jspArrowRight" />').bind("mousedown.jsp",aE(1,0)).bind("click.jsp",aC);
            if(az.arrowScrollOnHover){ay.bind("mouseover.jsp",aE(-1,0,ay));x.bind("mouseover.jsp",aE(1,0,x))}al(G,az.horizontalArrowPositions,ay,x)}h.hover(function(){h.addClass("jspHover")},function(){h.removeClass("jspHover")}).bind("mousedown.jsp",function(aJ){b("html").bind("dragstart.jsp selectstart.jsp",aC);h.addClass("jspActive");var s=aJ.pageX-h.position().left;b("html").bind("mousemove.jsp",function(aK){W(aK.pageX-s,false)}).bind("mouseup.jsp mouseleave.jsp",ax);return false});l=am.innerWidth();ah()}}function ah(){am.find(">.jspHorizontalBar>.jspCap:visible,>.jspHorizontalBar>.jspArrow").each(function(){l-=b(this).outerWidth()});G.width(l+"px");aa=0}function F(){if(aF&&aA){var aJ=G.outerHeight(),s=aq.outerWidth();t-=aJ;b(an).find(">.jspCap:visible,>.jspArrow").each(function(){l+=b(this).outerWidth()});l-=s;v-=s;ak-=aJ;G.parent().append(b('<div class="jspCorner" />').css("width",aJ+"px"));o();ah()}if(aF){Y.width((am.outerWidth()-f)+"px")}Z=Y.outerHeight();q=Z/v;if(aF){au=Math.ceil(1/y*l);if(au>az.horizontalDragMaxWidth){au=az.horizontalDragMaxWidth}else{if(au<az.horizontalDragMinWidth){au=az.horizontalDragMinWidth}}h.width(au+"px");j=l-au;ae(aa)}if(aA){A=Math.ceil(1/q*t);if(A>az.verticalDragMaxHeight){A=az.verticalDragMaxHeight}else{if(A<az.verticalDragMinHeight){A=az.verticalDragMinHeight}}av.height(A+"px");i=t-A;ad(I)}}function al(aK,aM,aJ,s){var aO="before",aL="after",aN;if(aM=="os"){aM=/Mac/.test(navigator.platform)?"after":"split"}if(aM==aO){aL=aM}else{if(aM==aL){aO=aM;aN=aJ;aJ=s;s=aN}}aK[aO](aJ)[aL](s)}function aE(aJ,s,aK){return function(){H(aJ,s,this,aK);this.blur();return false}}function H(aM,aL,aP,aO){aP=b(aP).addClass("jspActive");var aN,aK,aJ=true,s=function(){if(aM!==0){Q.scrollByX(aM*az.arrowButtonSpeed)}if(aL!==0){Q.scrollByY(aL*az.arrowButtonSpeed)}aK=setTimeout(s,aJ?az.initialDelay:az.arrowRepeatFreq);aJ=false};s();aN=aO?"mouseout.jsp":"mouseup.jsp";aO=aO||b("html");aO.bind(aN,function(){aP.removeClass("jspActive");aK&&clearTimeout(aK);aK=null;aO.unbind(aN)})}function p(){w();if(aA){aq.bind("mousedown.jsp",function(aO){if(aO.originalTarget===c||aO.originalTarget==aO.currentTarget){var aM=b(this),aP=aM.offset(),aN=aO.pageY-aP.top-I,aK,aJ=true,s=function(){var aS=aM.offset(),aT=aO.pageY-aS.top-A/2,aQ=v*az.scrollPagePercent,aR=i*aQ/(Z-v);if(aN<0){if(I-aR>aT){Q.scrollByY(-aQ)}else{V(aT)}}else{if(aN>0){if(I+aR<aT){Q.scrollByY(aQ)}else{V(aT)}}else{aL();return}}aK=setTimeout(s,aJ?az.initialDelay:az.trackClickRepeatFreq);aJ=false},aL=function(){aK&&clearTimeout(aK);aK=null;b(document).unbind("mouseup.jsp",aL)};s();b(document).bind("mouseup.jsp",aL);return false}})}if(aF){G.bind("mousedown.jsp",function(aO){if(aO.originalTarget===c||aO.originalTarget==aO.currentTarget){var aM=b(this),aP=aM.offset(),aN=aO.pageX-aP.left-aa,aK,aJ=true,s=function(){var aS=aM.offset(),aT=aO.pageX-aS.left-au/2,aQ=ak*az.scrollPagePercent,aR=j*aQ/(T-ak);if(aN<0){if(aa-aR>aT){Q.scrollByX(-aQ)}else{W(aT)}}else{if(aN>0){if(aa+aR<aT){Q.scrollByX(aQ)}else{W(aT)}}else{aL();return}}aK=setTimeout(s,aJ?az.initialDelay:az.trackClickRepeatFreq);aJ=false},aL=function(){aK&&clearTimeout(aK);aK=null;b(document).unbind("mouseup.jsp",aL)};s();b(document).bind("mouseup.jsp",aL);return false}})}}function w(){if(G){G.unbind("mousedown.jsp")}if(aq){aq.unbind("mousedown.jsp")}}function ax(){b("html").unbind("dragstart.jsp selectstart.jsp mousemove.jsp mouseup.jsp mouseleave.jsp");if(av){av.removeClass("jspActive")}if(h){h.removeClass("jspActive")}}function V(s,aJ){if(!aA){return}if(s<0){s=0}else{if(s>i){s=i}}if(aJ===c){aJ=az.animateScroll}if(aJ){Q.animate(av,"top",s,ad)}else{av.css("top",s);ad(s)}}function ad(aJ){if(aJ===c){aJ=av.position().top}am.scrollTop(0);I=aJ;var aM=I===0,aK=I==i,aL=aJ/i,s=-aL*(Z-v);if(aj!=aM||aH!=aK){aj=aM;aH=aK;D.trigger("jsp-arrow-change",[aj,aH,P,k])}u(aM,aK);Y.css("top",s);D.trigger("jsp-scroll-y",[-s,aM,aK]).trigger("scroll")}function W(aJ,s){if(!aF){return}if(aJ<0){aJ=0}else{if(aJ>j){aJ=j}}if(s===c){s=az.animateScroll}if(s){Q.animate(h,"left",aJ,ae)
            }else{h.css("left",aJ);ae(aJ)}}function ae(aJ){if(aJ===c){aJ=h.position().left}am.scrollTop(0);aa=aJ;var aM=aa===0,aL=aa==j,aK=aJ/j,s=-aK*(T-ak);if(P!=aM||k!=aL){P=aM;k=aL;D.trigger("jsp-arrow-change",[aj,aH,P,k])}r(aM,aL);Y.css("left",s);D.trigger("jsp-scroll-x",[-s,aM,aL]).trigger("scroll")}function u(aJ,s){if(az.showArrows){ar[aJ?"addClass":"removeClass"]("jspDisabled");af[s?"addClass":"removeClass"]("jspDisabled")}}function r(aJ,s){if(az.showArrows){ay[aJ?"addClass":"removeClass"]("jspDisabled");x[s?"addClass":"removeClass"]("jspDisabled")}}function M(s,aJ){var aK=s/(Z-v);V(aK*i,aJ)}function N(aJ,s){var aK=aJ/(T-ak);W(aK*j,s)}function ab(aW,aR,aK){var aO,aL,aM,s=0,aV=0,aJ,aQ,aP,aT,aS,aU;try{aO=b(aW)}catch(aN){return}aL=aO.outerHeight();aM=aO.outerWidth();am.scrollTop(0);am.scrollLeft(0);while(!aO.is(".jspPane")){s+=aO.position().top;aV+=aO.position().left;aO=aO.offsetParent();if(/^body|html$/i.test(aO[0].nodeName)){return}}aJ=aB();aP=aJ+v;if(s<aJ||aR){aS=s-az.verticalGutter}else{if(s+aL>aP){aS=s-v+aL+az.verticalGutter}}if(aS){M(aS,aK)}aQ=aD();aT=aQ+ak;if(aV<aQ||aR){aU=aV-az.horizontalGutter}else{if(aV+aM>aT){aU=aV-ak+aM+az.horizontalGutter}}if(aU){N(aU,aK)}}function aD(){return -Y.position().left}function aB(){return -Y.position().top}function K(){var s=Z-v;return(s>20)&&(s-aB()<10)}function B(){var s=T-ak;return(s>20)&&(s-aD()<10)}function ag(){am.unbind(ac).bind(ac,function(aM,aN,aL,aJ){var aK=aa,s=I;Q.scrollBy(aL*az.mouseWheelSpeed,-aJ*az.mouseWheelSpeed,false);return aK==aa&&s==I})}function n(){am.unbind(ac)}function aC(){return false}function J(){Y.find(":input,a").unbind("focus.jsp").bind("focus.jsp",function(s){ab(s.target,false)})}function E(){Y.find(":input,a").unbind("focus.jsp")}function S(){var s,aJ,aL=[];aF&&aL.push(an[0]);aA&&aL.push(U[0]);Y.focus(function(){D.focus()});D.attr("tabindex",0).unbind("keydown.jsp keypress.jsp").bind("keydown.jsp",function(aO){if(aO.target!==this&&!(aL.length&&b(aO.target).closest(aL).length)){return}var aN=aa,aM=I;switch(aO.keyCode){case 40:case 38:case 34:case 32:case 33:case 39:case 37:s=aO.keyCode;aK();break;case 35:M(Z-v);s=null;break;case 36:M(0);s=null;break}aJ=aO.keyCode==s&&aN!=aa||aM!=I;return !aJ}).bind("keypress.jsp",function(aM){if(aM.keyCode==s){aK()}return !aJ});if(az.hideFocus){D.css("outline","none");if("hideFocus" in am[0]){D.attr("hideFocus",true)}}else{D.css("outline","");if("hideFocus" in am[0]){D.attr("hideFocus",false)}}function aK(){var aN=aa,aM=I;switch(s){case 40:Q.scrollByY(az.keyboardSpeed,false);break;case 38:Q.scrollByY(-az.keyboardSpeed,false);break;case 34:case 32:Q.scrollByY(v*az.scrollPagePercent,false);break;case 33:Q.scrollByY(-v*az.scrollPagePercent,false);break;case 39:Q.scrollByX(az.keyboardSpeed,false);break;case 37:Q.scrollByX(-az.keyboardSpeed,false);break}aJ=aN!=aa||aM!=I;return aJ}}function R(){D.attr("tabindex","-1").removeAttr("tabindex").unbind("keydown.jsp keypress.jsp")}function C(){if(location.hash&&location.hash.length>1){var aK,aJ;try{aK=b(location.hash)}catch(s){return}if(aK.length&&Y.find(location.hash)){if(am.scrollTop()===0){aJ=setInterval(function(){if(am.scrollTop()>0){ab(location.hash,true);b(document).scrollTop(am.position().top);clearInterval(aJ)}},50)}else{ab(location.hash,true);b(document).scrollTop(am.position().top)}}}}function ai(){b("a.jspHijack").unbind("click.jsp-hijack").removeClass("jspHijack")}function m(){ai();b("a[href^=#]").addClass("jspHijack").bind("click.jsp-hijack",function(){var s=this.href.split("#"),aJ;if(s.length>1){aJ=s[1];if(aJ.length>0&&Y.find("#"+aJ).length>0){ab("#"+aJ,true);return false}}})}function ao(){var aK,aJ,aM,aL,aN,s=false;am.unbind("touchstart.jsp touchmove.jsp touchend.jsp click.jsp-touchclick").bind("touchstart.jsp",function(aO){var aP=aO.originalEvent.touches[0];aK=aD();aJ=aB();aM=aP.pageX;aL=aP.pageY;aN=false;s=true}).bind("touchmove.jsp",function(aR){if(!s){return}var aQ=aR.originalEvent.touches[0],aP=aa,aO=I;Q.scrollTo(aK+aM-aQ.pageX,aJ+aL-aQ.pageY);aN=aN||Math.abs(aM-aQ.pageX)>5||Math.abs(aL-aQ.pageY)>5;
            return aP==aa&&aO==I}).bind("touchend.jsp",function(aO){s=false}).bind("click.jsp-touchclick",function(aO){if(aN){aN=false;return false}})}function g(){var s=aB(),aJ=aD();D.removeClass("jspScrollable").unbind(".jsp");D.replaceWith(ap.append(Y.children()));ap.scrollTop(s);ap.scrollLeft(aJ)}b.extend(Q,{reinitialise:function(aJ){aJ=b.extend({},az,aJ);at(aJ)},scrollToElement:function(aK,aJ,s){ab(aK,aJ,s)},scrollTo:function(aK,s,aJ){N(aK,aJ);M(s,aJ)},scrollToX:function(aJ,s){N(aJ,s)},scrollToY:function(s,aJ){M(s,aJ)},scrollToPercentX:function(aJ,s){N(aJ*(T-ak),s)},scrollToPercentY:function(aJ,s){M(aJ*(Z-v),s)},scrollBy:function(aJ,s,aK){Q.scrollByX(aJ,aK);Q.scrollByY(s,aK)},scrollByX:function(s,aK){s=(s>=0)?Math.max(s,1):Math.min(s,-1);var aJ=aD()+s,aL=aJ/(T-ak);W(aL*j,aK)},scrollByY:function(s,aK){s=(s>=0)?Math.max(s,1):Math.min(s,-1);var aJ=aB()+s,aL=aJ/(Z-v);V(aL*i,aK)},positionDragX:function(s,aJ){W(s,aJ)},positionDragY:function(aJ,s){V(aJ,s)},animate:function(aJ,aM,s,aL){var aK={};aK[aM]=s;aJ.animate(aK,{duration:az.animateDuration,ease:az.animateEase,queue:false,step:aL})},getContentPositionX:function(){return aD()},getContentPositionY:function(){return aB()},getContentWidth:function(){return T},getContentHeight:function(){return Z},getPercentScrolledX:function(){return aD()/(T-ak)},getPercentScrolledY:function(){return aB()/(Z-v)},getIsScrollableH:function(){return aF},getIsScrollableV:function(){return aA},getContentPane:function(){return Y},scrollToBottom:function(s){V(i,s)},hijackInternalLinks:function(){m()},destroy:function(){g()}});at(O)}e=b.extend({},b.fn.jScrollPane.defaults,e);b.each(["mouseWheelSpeed","arrowButtonSpeed","trackClickSpeed","keyboardSpeed"],function(){e[this]=e[this]||e.speed});return this.each(function(){var f=b(this),g=f.data("jsp");if(g){g.reinitialise(e)}else{g=new d(f,e);f.data("jsp",g)}})};b.fn.jScrollPane.defaults={showArrows:false,maintainPosition:true,stickToBottom:false,stickToRight:false,clickOnTrack:true,autoReinitialise:false,autoReinitialiseDelay:500,verticalDragMinHeight:0,verticalDragMaxHeight:99999,horizontalDragMinWidth:0,horizontalDragMaxWidth:99999,contentWidth:c,animateScroll:false,animateDuration:300,animateEase:"linear",hijackInternalLinks:false,verticalGutter:4,horizontalGutter:4,mouseWheelSpeed:0,arrowButtonSpeed:0,arrowRepeatFreq:50,arrowScrollOnHover:false,trackClickSpeed:0,trackClickRepeatFreq:70,verticalArrowPositions:"split",horizontalArrowPositions:"split",enableKeyboardNavigation:true,hideFocus:false,keyboardSpeed:0,initialDelay:300,speed:30,scrollPagePercent:0.8}
        }
        //end function plugin_jquery_jScrollPane

        //function plugin_jquery_twitterTip
        function plugin_jquery_twitterTip($){
            /* ===========================================================
             * bootstrap-tooltip.js v2.0.2
             * http://twitter.github.com/bootstrap/javascript.html#tooltips
             * Inspired by the original jQuery.tipsy by Jason Frame
             * ===========================================================
             * Copyright 2012 Twitter, Inc.
             *
             * Licensed under the Apache License, Version 2.0 (the "License");
             * you may not use this file except in compliance with the License.
             * You may obtain a copy of the License at
             *
             * http://www.apache.org/licenses/LICENSE-2.0
             *
             * Unless required by applicable law or agreed to in writing, software
             * distributed under the License is distributed on an "AS IS" BASIS,
             * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
             * See the License for the specific language governing permissions and
             * limitations under the License.
             * ========================================================== */

            !function( $ ) {

              "use strict"

             /* TOOLTIP PUBLIC CLASS DEFINITION
              * =============================== */

              var Tooltip = function ( element, options ) {
                this.init('tooltip', element, options);
              }

              Tooltip.prototype = {

                constructor: Tooltip

              , init: function ( type, element, options ) {
                  var eventIn
                    , eventOut

                  this.type = type
                  this.$element = $(element)
                  this.options = this.getOptions(options)
                  this.enabled = true

                  if (this.options.trigger != 'manual') {
                    eventIn  = this.options.trigger == 'hover' ? 'mouseenter' : 'focus'
                    eventOut = this.options.trigger == 'hover' ? 'mouseleave' : 'blur'
                    this.$element.bind(eventIn, this.options.selector, $.proxy(this.enter, this))
                    this.$element.bind(eventOut, this.options.selector, $.proxy(this.leave, this))
                  }

                  this.options.selector ?
                    (this._options = $.extend({}, this.options, { trigger: 'manual', selector: '' })) :
                    this.fixTitle()
                }

              , getOptions: function ( options ) {
                  options = $.extend({}, $.fn[this.type].defaults, options, this.$element.data())

                  if (options.delay && typeof options.delay == 'number') {
                    options.delay = {
                      show: options.delay
                    , hide: options.delay
                    }
                  }

                  return options
                }

              , enter: function ( e ) {
                  var self = $(e.currentTarget)[this.type](this._options).data(this.type)

                  if (!self.options.delay || !self.options.delay.show) {
                    self.show()
                  } else {
                    self.hoverState = 'in'
                    setTimeout(function() {
                      if (self.hoverState == 'in') {
                        self.show()
                      }
                    }, self.options.delay.show)
                  }
                }

              , leave: function ( e ) {
                  var self = $(e.currentTarget)[this.type](this._options).data(this.type)

                  if (!self.options.delay || !self.options.delay.hide) {
                    self.hide()
                  } else {
                    self.hoverState = 'out'
                    setTimeout(function() {
                      if (self.hoverState == 'out') {
                        self.hide()
                      }
                    }, self.options.delay.hide)
                  }
                }

              , show: function () {
                  var $tip
                    , inside
                    , pos
                    , actualWidth
                    , actualHeight
                    , placement
                    , tp

                  if (this.hasContent() && this.enabled) {
                    $tip = this.tip()
                    this.setContent()

                    if (this.options.animation) {
                      $tip.addClass('ant_tw_fade')
                    }

                    placement = typeof this.options.placement == 'function' ?
                      this.options.placement.call(this, $tip[0], this.$element[0]) :
                      this.options.placement

                    inside = /ant_tw_in/.test(placement)

                    $tip
                      .remove()
                      .css({ top: 0, left: 0, display:"block" })
                      .appendTo(inside ? this.$element : document.body)

                    pos = this.getPosition(inside)

                    actualWidth = $tip[0].offsetWidth
                    actualHeight = $tip[0].offsetHeight

                    switch (inside ? placement.split(' ')[1] : placement) {
                      case 'bottom':
                        tp = {top: pos.top + pos.height, left: pos.left + pos.width / 2 - actualWidth / 2}
                        break
                      case 'top':
                        tp = {top: pos.top - actualHeight - 5, left: pos.left + pos.width / 2 - actualWidth / 2}
                        break
                      case 'left':
                        tp = {top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left - actualWidth}
                        break
                      case 'right':
                        tp = {top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left + pos.width}
                        break
                    }

                    $tip
                      .css(tp)
                      .addClass('ant_tw_'+placement)
                      .addClass('ant_tw_in')
                  }
                }

              , setContent: function () {
                  var $tip = this.tip()
                  $tip.find('.ant_twtooltip-inner').html(this.getTitle())
                  $tip.removeClass('ant_tw_fade ant_tw_in ant_tw_top ant_tw_bottom ant_tw_left ant_tw_right')
                }

              , hide: function () {
                  var that = this
                    , $tip = this.tip()

                  $tip.removeClass('ant_tw_in')

                  function removeWithAnimation() {
                    var timeout = setTimeout(function () {
                      $tip.off($.support.transition.end).remove();
                    }, 500)

                    $tip.one($.support.transition.end, function () {
                      clearTimeout(timeout)
                      $tip.remove()
                    })
                  }

                  $.support.transition && this.$tip.hasClass('ant_tw_fade') ?
                    removeWithAnimation() :
                    $tip.remove();
                    if ( $.support.transition && this.$tip.hasClass('ant_tw_fade') ) {
                    } else {
                    }
                }

              , fixTitle: function () {
                  var $e = this.$element
                  if ($e.attr('title') || typeof($e.attr('data-original-title')) != 'string') {
                    $e.attr('data-original-title', $e.attr('title') || '').removeAttr('title')
                  }
                }

              , hasContent: function () {
                  return this.getTitle()
                }

              , getPosition: function (inside) {
                  return $.extend({}, (inside ? {top: 0, left: 0} : this.$element.offset()), {
                    width: this.$element[0].offsetWidth
                  , height: this.$element[0].offsetHeight
                  })
                }

              , getTitle: function () {
                  var title
                    , $e = this.$element
                    , o = this.options

                  title = $e.attr('data-original-title')
                    || (typeof o.title == 'function' ? o.title.call($e[0]) :  o.title)

                  title = (title || '').toString().replace(/(^\s*|\s*$)/, "")

                  return title
                }

              , tip: function () {
                  return this.$tip = this.$tip || $(this.options.template)
                }

              , validate: function () {
                  if (!this.$element[0].parentNode) {
                    this.hide()
                    this.$element = null
                    this.options = null
                  }
                }

              , enable: function () {
                  this.enabled = true
                }

              , disable: function () {
                  this.enabled = false
                }

              , toggleEnabled: function () {
                  this.enabled = !this.enabled
                }

              , toggle: function () {
                  this[this.tip().hasClass('ant_tw_in') ? 'hide' : 'show']()
                }

              }


             /* TOOLTIP PLUGIN DEFINITION
              * ========================= */

              $.fn.tooltip = function ( option ) {
                return this.each(function () {
                  var $this = $(this)
                    , data = $this.data('tooltip')
                    , options = typeof option == 'object' && option
                  if (!data) $this.data('tooltip', (data = new Tooltip(this, options)))
                  if (typeof option == 'string') data[option]()
                })
              }

              $.fn.tooltip.Constructor = Tooltip

              $.fn.tooltip.defaults = {
                animation: true
              , delay: 0
              , selector: false
              , placement: 'top'
              , trigger: 'hover'
              , title: ''
              , template: '<div class="ant ant_twtooltip"><div class="ant_twtooltip-arrow"></div><div class="ant_twtooltip-inner"></div></div>'
              }
            }( $ );
        }
        //end function plugin_jquery_twitterTip

        function plugin_rangy(){

            /***************/
            /*rangy scripts*/
            /***************/

            //rangy-core.js
            /*
             Rangy, a cross-browser JavaScript range and selection library
             http://code.google.com/p/rangy/

             Copyright 2011, Tim Down
             Licensed under the MIT license.
             //todo: update the version number
             Version: 1.1.2 - I believe this is now using Rangy 1.2 beta 2 release from 5 August 2011
             Build date: 30 May 2011 - I believe this is now using Rangy 1.2 beta 2 release from 5 August 2011
            */

            /*antenna tweak to code:  replaced 4 instances of "span" with the var ant_node */
            var ant_node = "ins"; /*use the html node ins instead of span to avoid having the client's css affect our hilite wrapper*/

            var rangy=function(){function k(o,u){var x=typeof o[u];return x=="function"||!!(x=="object"&&o[u])||x=="unknown"}function L(o,u){return!!(typeof o[u]=="object"&&o[u])}function J(o,u){return typeof o[u]!="undefined"}function K(o){return function(u,x){for(var B=x.length;B--;)if(!o(u,x[B]))return false;return true}}function z(o){return o&&A(o,y)&&v(o,s)}function C(o){window.alert("Rangy not supported in your browser. Reason: "+o);c.initialized=true;c.supported=false}function N(){if(!c.initialized){var o,
            u=false,x=false;if(k(document,"createRange")){o=document.createRange();if(A(o,n)&&v(o,h))u=true;o.detach()}if((o=L(document,"body")?document.body:document.getElementsByTagName("body")[0])&&k(o,"createTextRange")){o=o.createTextRange();if(z(o))x=true}!u&&!x&&C("Neither Range nor TextRange are implemented");c.initialized=true;c.features={implementsDomRange:u,implementsTextRange:x};u=j.concat(f);x=0;for(o=u.length;x<o;++x)try{u[x](c)}catch(B){L(window,"console")&&k(window.console,"log")&&window.console.log("Init listener threw an exception. Continuing.",
            B)}}}function P(o){this.name=o;this.supported=this.initialized=false}var h=["startContainer","startOffset","endContainer","endOffset","collapsed","commonAncestorContainer","START_TO_START","START_TO_END","END_TO_START","END_TO_END"],n=["setStart","setStartBefore","setStartAfter","setEnd","setEndBefore","setEndAfter","collapse","selectNode","selectNodeContents","compareBoundaryPoints","deleteContents","extractContents","cloneContents","insertNode","surroundContents","cloneRange","toString","detach"],
            s=["boundingHeight","boundingLeft","boundingTop","boundingWidth","htmlText","text"],y=["collapse","compareEndPoints","duplicate","getBookmark","moveToBookmark","moveToElementText","parentElement","pasteHTML","select","setEndPoint"],A=K(k),p=K(L),v=K(J),c={version:"1.2beta2",initialized:false,supported:true,util:{isHostMethod:k,isHostObject:L,isHostProperty:J,areHostMethods:A,areHostObjects:p,areHostProperties:v,isTextRange:z},features:{},modules:{},config:{alertOnWarn:false,preferTextRange:false}};
            c.fail=C;c.warn=function(o){o="Rangy warning: "+o;if(c.config.alertOnWarn)window.alert(o);else typeof window.console!="undefined"&&typeof window.console.log!="undefined"&&window.console.log(o)};if({}.hasOwnProperty)c.util.extend=function(o,u){for(var x in u)if(u.hasOwnProperty(x))o[x]=u[x]};else C("hasOwnProperty not supported");var f=[],j=[];c.init=N;c.addInitListener=function(o){c.initialized?o(c):f.push(o)};var r=[];c.addCreateMissingNativeApiListener=function(o){r.push(o)};c.createMissingNativeApi=
            function(o){o=o||window;N();for(var u=0,x=r.length;u<x;++u)r[u](o)};P.prototype.fail=function(o){this.initialized=true;this.supported=false;throw Error("Module '"+this.name+"' failed to load: "+o);};P.prototype.warn=function(o){c.warn("Module "+this.name+": "+o)};P.prototype.createError=function(o){return Error("Error in Rangy "+this.name+" module: "+o)};c.createModule=function(o,u){var x=new P(o);c.modules[o]=x;j.push(function(B){u(B,x);x.initialized=true;x.supported=true})};c.requireModules=function(o){for(var u=
            0,x=o.length,B,D;u<x;++u){D=o[u];B=c.modules[D];if(!B||!(B instanceof P))throw Error("Module '"+D+"' not found");if(!B.supported)throw Error("Module '"+D+"' not supported");}};var M=false;p=function(){if(!M){M=true;c.initialized||N()}};if(typeof window=="undefined")C("No window found");else if(typeof document=="undefined")C("No document found");else{k(document,"addEventListener")&&document.addEventListener("DOMContentLoaded",p,false);if(k(window,"addEventListener"))window.addEventListener("load",
            p,false);else k(window,"attachEvent")?window.attachEvent("onload",p):C("Window does not have required addEventListener or attachEvent method");return c}}();
            rangy.createModule("DomUtil",function(k,L){function J(c){for(var f=0;c=c.previousSibling;)f++;return f}function K(c,f){var j=[],r;for(r=c;r;r=r.parentNode)j.push(r);for(r=f;r;r=r.parentNode)if(v(j,r))return r;return null}function z(c,f,j){for(j=j?c:c.parentNode;j;){c=j.parentNode;if(c===f)return j;j=c}return null}function C(c){c=c.nodeType;return c==3||c==4||c==8}function N(c,f){var j=f.nextSibling,r=f.parentNode;j?r.insertBefore(c,j):r.appendChild(c);return c}function P(c){if(c.nodeType==9)return c;
            else if(typeof c.ownerDocument!="undefined")return c.ownerDocument;else if(typeof c.document!="undefined")return c.document;else if(c.parentNode)return P(c.parentNode);else throw Error("getDocument: no document found for node");}function h(c){if(!c)return"[No node]";return C(c)?'"'+c.data+'"':c.nodeType==1?"<"+c.nodeName+(c.id?' id="'+c.id+'"':"")+">["+c.childNodes.length+"]":c.nodeName}function n(c){this._next=this.root=c}function s(c,f){this.node=c;this.offset=f}function y(c){this.code=this[c];
            this.codeName=c;this.message="DOMException: "+this.codeName}var A=k.util;A.areHostMethods(document,["createDocumentFragment","createElement","createTextNode"])||L.fail("document missing a Node creation method");A.isHostMethod(document,"getElementsByTagName")||L.fail("document missing getElementsByTagName method");var p=document.createElement("div");A.areHostMethods(p,["insertBefore","appendChild","cloneNode"])||L.fail("Incomplete Element implementation");p=document.createTextNode("test");A.areHostMethods(p,
            ["splitText","deleteData","insertData","appendData","cloneNode"])||L.fail("Incomplete Text Node implementation");var v=function(c,f){for(var j=c.length;j--;)if(c[j]===f)return true;return false};n.prototype={_current:null,hasNext:function(){return!!this._next},next:function(){var c=this._current=this._next,f;if(this._current)if(f=c.firstChild)this._next=f;else{for(f=null;c!==this.root&&!(f=c.nextSibling);)c=c.parentNode;this._next=f}return this._current},detach:function(){this._current=this._next=
            this.root=null}};s.prototype={equals:function(c){return this.node===c.node&this.offset==c.offset},inspect:function(){return"[DomPosition("+h(this.node)+":"+this.offset+")]"}};y.prototype={INDEX_SIZE_ERR:1,HIERARCHY_REQUEST_ERR:3,WRONG_DOCUMENT_ERR:4,NO_MODIFICATION_ALLOWED_ERR:7,NOT_FOUND_ERR:8,NOT_SUPPORTED_ERR:9,INVALID_STATE_ERR:11};y.prototype.toString=function(){return this.message};k.dom={arrayContains:v,getNodeIndex:J,getNodeLength:function(c){var f;return C(c)?c.length:(f=c.childNodes)?f.length:
            0},getCommonAncestor:K,isAncestorOf:function(c,f,j){for(f=j?f:f.parentNode;f;)if(f===c)return true;else f=f.parentNode;return false},getClosestAncestorIn:z,isCharacterDataNode:C,insertAfter:N,splitDataNode:function(c,f){var j=c.cloneNode(false);j.deleteData(0,f);c.deleteData(f,c.length-f);N(j,c);return j},getDocument:P,getWindow:function(c){c=P(c);if(typeof c.defaultView!="undefined")return c.defaultView;else if(typeof c.parentWindow!="undefined")return c.parentWindow;else throw Error("Cannot get a window object for node");
            },getIframeWindow:function(c){if(typeof c.contentWindow!="undefined")return c.contentWindow;else if(typeof c.contentDocument!="undefined")return c.contentDocument.defaultView;else throw Error("getIframeWindow: No Window object found for iframe element");},getIframeDocument:function(c){if(typeof c.contentDocument!="undefined")return c.contentDocument;else if(typeof c.contentWindow!="undefined")return c.contentWindow.document;else throw Error("getIframeWindow: No Document object found for iframe element");
            },getBody:function(c){return A.isHostObject(c,"body")?c.body:c.getElementsByTagName("body")[0]},getRootContainer:function(c){for(var f;f=c.parentNode;)c=f;return c},comparePoints:function(c,f,j,r){var M;if(c==j)return f===r?0:f<r?-1:1;else if(M=z(j,c,true))return f<=J(M)?-1:1;else if(M=z(c,j,true))return J(M)<r?-1:1;else{f=K(c,j);c=c===f?f:z(c,f,true);j=j===f?f:z(j,f,true);if(c===j)throw Error("comparePoints got to case 4 and childA and childB are the same!");else{for(f=f.firstChild;f;){if(f===c)return-1;
            else if(f===j)return 1;f=f.nextSibling}throw Error("Should not be here!");}}},inspectNode:h,createIterator:function(c){return new n(c)},DomPosition:s};k.DOMException=y});
            rangy.createModule("DomRange",function(k){function L(a,e){return a.nodeType!=3&&(l.isAncestorOf(a,e.startContainer,true)||l.isAncestorOf(a,e.endContainer,true))}function J(a){return l.getDocument(a.startContainer)}function K(a,e,g){if(e=a._listeners[e])for(var q=0,G=e.length;q<G;++q)e[q].call(a,{target:a,args:g})}function z(a){return new E(a.parentNode,l.getNodeIndex(a))}function C(a){return new E(a.parentNode,l.getNodeIndex(a)+1)}function N(a,e,g){var q=a.nodeType==11?a.firstChild:a;if(l.isCharacterDataNode(e))g==
            e.length?l.insertAfter(a,e):e.parentNode.insertBefore(a,g==0?e:l.splitDataNode(e,g));else g>=e.childNodes.length?e.appendChild(a):e.insertBefore(a,e.childNodes[g]);return q}function P(a){for(var e,g,q=J(a.range).createDocumentFragment();g=a.next();){e=a.isPartiallySelectedSubtree();g=g.cloneNode(!e);if(e){e=a.getSubtreeIterator();g.appendChild(P(e));e.detach(true)}if(g.nodeType==10)throw new Q("HIERARCHY_REQUEST_ERR");q.appendChild(g)}return q}function h(a,e,g){var q,G;for(g=g||{stop:false};q=a.next();)if(a.isPartiallySelectedSubtree())if(e(q)===
            false){g.stop=true;return}else{q=a.getSubtreeIterator();h(q,e,g);q.detach(true);if(g.stop)return}else for(q=l.createIterator(q);G=q.next();)if(e(G)===false){g.stop=true;return}}function n(a){for(var e;a.next();)if(a.isPartiallySelectedSubtree()){e=a.getSubtreeIterator();n(e);e.detach(true)}else a.remove()}function s(a){for(var e,g=J(a.range).createDocumentFragment(),q;e=a.next();){if(a.isPartiallySelectedSubtree()){e=e.cloneNode(false);q=a.getSubtreeIterator();e.appendChild(s(q));q.detach(true)}else a.remove();
            if(e.nodeType==10)throw new Q("HIERARCHY_REQUEST_ERR");g.appendChild(e)}return g}function y(a,e,g){var q=!!(e&&e.length),G,U=!!g;if(q)G=RegExp("^("+e.join("|")+")$");var ba=[];h(new p(a,false),function(m){if((!q||G.test(m.nodeType))&&(!U||g(m)))ba.push(m)});return ba}function A(a){return"["+(typeof a.getName=="undefined"?"Range":a.getName())+"("+l.inspectNode(a.startContainer)+":"+a.startOffset+", "+l.inspectNode(a.endContainer)+":"+a.endOffset+")]"}function p(a,e){this.range=a;this.clonePartiallySelectedTextNodes=
            e;if(!a.collapsed){this.sc=a.startContainer;this.so=a.startOffset;this.ec=a.endContainer;this.eo=a.endOffset;var g=a.commonAncestorContainer;if(this.sc===this.ec&&l.isCharacterDataNode(this.sc)){this.isSingleCharacterDataNode=true;this._first=this._last=this._next=this.sc}else{this._first=this._next=this.sc===g&&!l.isCharacterDataNode(this.sc)?this.sc.childNodes[this.so]:l.getClosestAncestorIn(this.sc,g,true);this._last=this.ec===g&&!l.isCharacterDataNode(this.ec)?this.ec.childNodes[this.eo-1]:l.getClosestAncestorIn(this.ec,
            g,true)}}}function v(a){this.code=this[a];this.codeName=a;this.message="RangeException: "+this.codeName}function c(a,e,g){this.nodes=y(a,e,g);this._next=this.nodes[0];this._position=0}function f(a){return function(e,g){for(var q,G=g?e:e.parentNode;G;){q=G.nodeType;if(l.arrayContains(a,q))return G;G=G.parentNode}return null}}function j(a,e){if(F(a,e))throw new v("INVALID_NODE_TYPE_ERR");}function r(a){if(!a.startContainer)throw new Q("INVALID_STATE_ERR");}function M(a,e){if(!l.arrayContains(e,a.nodeType))throw new v("INVALID_NODE_TYPE_ERR");
            }function o(a,e){if(e<0||e>(l.isCharacterDataNode(a)?a.length:a.childNodes.length))throw new Q("INDEX_SIZE_ERR");}function u(a,e){if(d(a,true)!==d(e,true))throw new Q("WRONG_DOCUMENT_ERR");}function x(a){if(i(a,true))throw new Q("NO_MODIFICATION_ALLOWED_ERR");}function B(a,e){if(!a)throw new Q(e);}function D(a){r(a);if(!l.arrayContains(Y,a.startContainer.nodeType)&&!d(a.startContainer,true)||!l.arrayContains(Y,a.endContainer.nodeType)&&!d(a.endContainer,true)||!(a.startOffset<=(l.isCharacterDataNode(a.startContainer)?
            a.startContainer.length:a.startContainer.childNodes.length))||!(a.endOffset<=(l.isCharacterDataNode(a.endContainer)?a.endContainer.length:a.endContainer.childNodes.length)))/*ANTENNA EDIT*//*throw Error*/ANT.actions.catchRangyErrors("Range error: Range is no longer valid after DOM mutation ("+a.inspect()+")");/*end ANTENNA EDIT*/}function W(){}function ea(a){a.START_TO_START=O;a.START_TO_END=Z;a.END_TO_END=ka;a.END_TO_START=la;a.NODE_BEFORE=ma;a.NODE_AFTER=na;a.NODE_BEFORE_AND_AFTER=oa;a.NODE_INSIDE=ja}function $(a){ea(a);ea(a.prototype)}function X(a,e){return function(){D(this);
            var g=this.startContainer,q=this.startOffset,G=this.commonAncestorContainer,U=new p(this,true);if(g!==G){g=l.getClosestAncestorIn(g,G,true);q=C(g);g=q.node;q=q.offset}h(U,x);U.reset();G=a(U);U.detach();e(this,g,q,g,q);return G}}function ca(a,e,g){function q(m,t){return function(w){r(this);M(w,fa);M(b(w),Y);w=(m?z:C)(w);(t?G:U)(this,w.node,w.offset)}}function G(m,t,w){var I=m.endContainer,R=m.endOffset;if(t!==m.startContainer||w!==this.startOffset){if(b(t)!=b(I)||l.comparePoints(t,w,I,R)==1){I=t;R=
            w}e(m,t,w,I,R)}}function U(m,t,w){var I=m.startContainer,R=m.startOffset;if(t!==m.endContainer||w!==this.endOffset){if(b(t)!=b(I)||l.comparePoints(t,w,I,R)==-1){I=t;R=w}e(m,I,R,t,w)}}function ba(m,t,w){if(t!==m.startContainer||w!==this.startOffset||t!==m.endContainer||w!==this.endOffset)e(m,t,w,t,w)}a.prototype=new W;k.util.extend(a.prototype,{setStart:function(m,t){r(this);j(m,true);o(m,t);G(this,m,t)},setEnd:function(m,t){r(this);j(m,true);o(m,t);U(this,m,t)},setStartBefore:q(true,true),setStartAfter:q(false,
            true),setEndBefore:q(true,false),setEndAfter:q(false,false),collapse:function(m){D(this);m?e(this,this.startContainer,this.startOffset,this.startContainer,this.startOffset):e(this,this.endContainer,this.endOffset,this.endContainer,this.endOffset)},selectNodeContents:function(m){r(this);j(m,true);e(this,m,0,m,l.getNodeLength(m))},selectNode:function(m){r(this);j(m,false);M(m,fa);var t=z(m);m=C(m);e(this,t.node,t.offset,m.node,m.offset)},extractContents:X(s,e),deleteContents:X(n,e),canSurroundContents:function(){D(this);
            x(this.startContainer);x(this.endContainer);var m=new p(this,true),t=m._first&&L(m._first,this)||m._last&&L(m._last,this);m.detach();return!t},detach:function(){g(this)},splitBoundaries:function(){D(this);var m=this.startContainer,t=this.startOffset,w=this.endContainer,I=this.endOffset,R=m===w;l.isCharacterDataNode(w)&&I>0&&I<w.length&&l.splitDataNode(w,I);if(l.isCharacterDataNode(m)&&t>0&&t<m.length){m=l.splitDataNode(m,t);if(R){I-=t;w=m}else w==m.parentNode&&I>=l.getNodeIndex(m)&&I++;t=0}e(this,
            m,t,w,I)},normalizeBoundaries:function(){D(this);var m=this.startContainer,t=this.startOffset,w=this.endContainer,I=this.endOffset,R=function(V){var S=V.nextSibling;if(S&&S.nodeType==V.nodeType){w=V;I=V.length;V.appendData(S.data);S.parentNode.removeChild(S)}},pa=function(V){var S=V.previousSibling;if(S&&S.nodeType==V.nodeType){m=V;var qa=V.length;t=S.length;V.insertData(0,S.data);S.parentNode.removeChild(S);if(m==w){I+=t;w=m}else if(w==V.parentNode){S=l.getNodeIndex(V);if(I==S){w=V;I=qa}else I>S&&
            I--}}},ga=true;if(l.isCharacterDataNode(w))w.length==I&&R(w);else{if(I>0)(ga=w.childNodes[I-1])&&l.isCharacterDataNode(ga)&&R(ga);ga=!this.collapsed}if(ga)if(l.isCharacterDataNode(m))t==0&&pa(m);else{if(t<m.childNodes.length)(R=m.childNodes[t])&&l.isCharacterDataNode(R)&&pa(R)}else{m=w;t=I}e(this,m,t,w,I)},collapseToPoint:function(m,t){D(this);j(m,true);o(m,t);ba(this,m,t)}});$(a)}function ha(a){a.collapsed=a.startContainer===a.endContainer&&a.startOffset===a.endOffset;a.commonAncestorContainer=a.collapsed?
            a.startContainer:l.getCommonAncestor(a.startContainer,a.endContainer)}function da(a,e,g,q,G){var U=a.startContainer!==e||a.startOffset!==g,ba=a.endContainer!==q||a.endOffset!==G;a.startContainer=e;a.startOffset=g;a.endContainer=q;a.endOffset=G;ha(a);K(a,"boundarychange",{startMoved:U,endMoved:ba})}function T(a){this.startContainer=a;this.startOffset=0;this.endContainer=a;this.endOffset=0;this._listeners={boundarychange:[],detach:[]};ha(this)}k.requireModules(["DomUtil"]);var l=k.dom,E=l.DomPosition,
            Q=k.DOMException;p.prototype={_current:null,_next:null,_first:null,_last:null,isSingleCharacterDataNode:false,reset:function(){this._current=null;this._next=this._first},hasNext:function(){return!!this._next},next:function(){var a=this._current=this._next;if(a){this._next=a!==this._last?a.nextSibling:null;if(l.isCharacterDataNode(a)&&this.clonePartiallySelectedTextNodes){if(a===this.ec)(a=a.cloneNode(true)).deleteData(this.eo,a.length-this.eo);if(this._current===this.sc)(a=a.cloneNode(true)).deleteData(0,
            this.so)}}return a},remove:function(){var a=this._current,e,g;if(l.isCharacterDataNode(a)&&(a===this.sc||a===this.ec)){e=a===this.sc?this.so:0;g=a===this.ec?this.eo:a.length;e!=g&&a.deleteData(e,g-e)}else a.parentNode&&a.parentNode.removeChild(a)},isPartiallySelectedSubtree:function(){return L(this._current,this.range)},getSubtreeIterator:function(){var a;if(this.isSingleCharacterDataNode){a=this.range.cloneRange();a.collapse()}else{a=new T(J(this.range));var e=this._current,g=e,q=0,G=e,U=l.getNodeLength(e);
            if(l.isAncestorOf(e,this.sc,true)){g=this.sc;q=this.so}if(l.isAncestorOf(e,this.ec,true)){G=this.ec;U=this.eo}da(a,g,q,G,U)}return new p(a,this.clonePartiallySelectedTextNodes)},detach:function(a){a&&this.range.detach();this.range=this._current=this._next=this._first=this._last=this.sc=this.so=this.ec=this.eo=null}};v.prototype={BAD_BOUNDARYPOINTS_ERR:1,INVALID_NODE_TYPE_ERR:2};v.prototype.toString=function(){return this.message};c.prototype={_current:null,hasNext:function(){return!!this._next},next:function(){this._current=
            this._next;this._next=this.nodes[++this._position];return this._current},detach:function(){this._current=this._next=this.nodes=null}};var fa=[1,3,4,5,7,8,10],Y=[2,9,11],ia=[1,3,4,5,7,8,10,11],aa=[1,3,4,5,7,8],b=l.getRootContainer,d=f([9,11]),i=f([5,6,10,12]),F=f([6,10,12]),H=["startContainer","startOffset","endContainer","endOffset","collapsed","commonAncestorContainer"],O=0,Z=1,ka=2,la=3,ma=0,na=1,oa=2,ja=3;W.prototype={attachListener:function(a,e){this._listeners[a].push(e)},compareBoundaryPoints:function(a,
            e){D(this);u(this.startContainer,e.startContainer);var g=a==la||a==O?"start":"end",q=a==Z||a==O?"start":"end";return l.comparePoints(this[g+"Container"],this[g+"Offset"],e[q+"Container"],e[q+"Offset"])},insertNode:function(a){D(this);M(a,ia);x(this.startContainer);if(l.isAncestorOf(a,this.startContainer,true))throw new Q("HIERARCHY_REQUEST_ERR");this.setStartBefore(N(a,this.startContainer,this.startOffset))},cloneContents:function(){D(this);var a,e;if(this.collapsed)return J(this).createDocumentFragment();
            else{if(this.startContainer===this.endContainer&&l.isCharacterDataNode(this.startContainer)){a=this.startContainer.cloneNode(true);a.data=a.data.slice(this.startOffset,this.endOffset);e=J(this).createDocumentFragment();e.appendChild(a);return e}else{e=new p(this,true);a=P(e);e.detach()}return a}},canSurroundContents:function(){D(this);x(this.startContainer);x(this.endContainer);var a=new p(this,true),e=a._first&&L(a._first,this)||a._last&&L(a._last,this);a.detach();return!e},surroundContents:function(a){M(a,
            aa);if(!this.canSurroundContents())throw new v("BAD_BOUNDARYPOINTS_ERR");var e=this.extractContents();if(a.hasChildNodes())for(;a.lastChild;)a.removeChild(a.lastChild);N(a,this.startContainer,this.startOffset);a.appendChild(e);this.selectNode(a)},cloneRange:function(){D(this);for(var a=new T(J(this)),e=H.length,g;e--;){g=H[e];a[g]=this[g]}return a},toString:function(){D(this);var a=this.startContainer;if(a===this.endContainer&&l.isCharacterDataNode(a))return a.nodeType==3||a.nodeType==4?a.data.slice(this.startOffset,
            this.endOffset):"";else{var e=[];a=new p(this,true);h(a,function(g){if(g.nodeType==3||g.nodeType==4)e.push(g.data)});a.detach();return e.join("")}},compareNode:function(a){D(this);var e=a.parentNode,g=l.getNodeIndex(a);if(!e)throw new Q("NOT_FOUND_ERR");a=this.comparePoint(e,g);e=this.comparePoint(e,g+1);return a<0?e>0?oa:ma:e>0?na:ja},comparePoint:function(a,e){D(this);B(a,"HIERARCHY_REQUEST_ERR");u(a,this.startContainer);if(l.comparePoints(a,e,this.startContainer,this.startOffset)<0)return-1;else if(l.comparePoints(a,
            e,this.endContainer,this.endOffset)>0)return 1;return 0},createContextualFragment:function(a){r(this);var e=J(this),g=e.createElement("div");g.innerHTML=a;for(a=e.createDocumentFragment();e=g.firstChild;)a.appendChild(e);return a},toHtml:function(){D(this);var a=J(this).createElement("div");a.appendChild(this.cloneContents());return a.innerHTML},intersectsNode:function(a,e){D(this);B(a,"NOT_FOUND_ERR");if(l.getDocument(a)!==J(this))return false;var g=a.parentNode,q=l.getNodeIndex(a);B(g,"NOT_FOUND_ERR");
            var G=l.comparePoints(g,q,this.endContainer,this.endOffset);g=l.comparePoints(g,q+1,this.startContainer,this.startOffset);return e?G<=0&&g>=0:G<0&&g>0},isPointInRange:function(a,e){D(this);B(a,"HIERARCHY_REQUEST_ERR");u(a,this.startContainer);return l.comparePoints(a,e,this.startContainer,this.startOffset)>=0&&l.comparePoints(a,e,this.endContainer,this.endOffset)<=0},intersectsRange:function(a,e){D(this);if(J(a)!=J(this))throw new Q("WRONG_DOCUMENT_ERR");var g=l.comparePoints(this.startContainer,
            this.startOffset,a.endContainer,a.endOffset),q=l.comparePoints(this.endContainer,this.endOffset,a.startContainer,a.startOffset);return e?g<=0&&q>=0:g<0&&q>0},intersection:function(a){if(this.intersectsRange(a)){var e=l.comparePoints(this.startContainer,this.startOffset,a.startContainer,a.startOffset),g=l.comparePoints(this.endContainer,this.endOffset,a.endContainer,a.endOffset),q=this.cloneRange();e==-1&&q.setStart(a.startContainer,a.startOffset);g==1&&q.setEnd(a.endContainer,a.endOffset);return q}return null},
            union:function(a){if(this.intersectsRange(a,true)){var e=this.cloneRange();l.comparePoints(a.startContainer,a.startOffset,this.startContainer,this.startOffset)==-1&&e.setStart(a.startContainer,a.startOffset);l.comparePoints(a.endContainer,a.endOffset,this.endContainer,this.endOffset)==1&&e.setEnd(a.endContainer,a.endOffset);return e}else throw new v("Ranges do not intersect");},containsNode:function(a,e){return e?this.intersectsNode(a,false):this.compareNode(a)==ja},containsNodeContents:function(a){return this.comparePoint(a,
            0)>=0&&this.comparePoint(a,l.getNodeLength(a))<=0},containsRange:function(a){return this.intersection(a).equals(a)},containsNodeText:function(a){var e=this.cloneRange();e.selectNode(a);var g=e.getNodes([3]);if(g.length>0){e.setStart(g[0],0);a=g.pop();e.setEnd(a,a.length);a=this.containsRange(e);e.detach();return a}else return this.containsNodeContents(a)},createNodeIterator:function(a,e){D(this);return new c(this,a,e)},getNodes:function(a,e){D(this);return y(this,a,e)},getDocument:function(){return J(this)},
            collapseBefore:function(a){r(this);this.setEndBefore(a);this.collapse(false)},collapseAfter:function(a){r(this);this.setStartAfter(a);this.collapse(true)},getName:function(){return"DomRange"},equals:function(a){return T.rangesEqual(this,a)},inspect:function(){return A(this)}};ca(T,da,function(a){r(a);a.startContainer=a.startOffset=a.endContainer=a.endOffset=null;a.collapsed=a.commonAncestorContainer=null;K(a,"detach",null);a._listeners=null});k.rangePrototype=W.prototype;T.rangeProperties=H;T.RangeIterator=
            p;T.copyComparisonConstants=$;T.createPrototypeRange=ca;T.inspect=A;T.getRangeDocument=J;T.rangesEqual=function(a,e){return a.startContainer===e.startContainer&&a.startOffset===e.startOffset&&a.endContainer===e.endContainer&&a.endOffset===e.endOffset};k.DomRange=T;k.RangeException=v});
            rangy.createModule("WrappedRange",function(k){function L(h,n,s,y){var A=h.duplicate();A.collapse(s);var p=A.parentElement();z.isAncestorOf(n,p,true)||(p=n);if(!p.canHaveHTML)return new C(p.parentNode,z.getNodeIndex(p));n=z.getDocument(p).createElement(ant_node);var v,c=s?"StartToStart":"StartToEnd";do{p.insertBefore(n,n.previousSibling);A.moveToElementText(n)}while((v=A.compareEndPoints(c,h))>0&&n.previousSibling);c=n.nextSibling;if(v==-1&&c&&z.isCharacterDataNode(c)){A.setEndPoint(s?"EndToStart":"EndToEnd",
            h);if(/[\r\n]/.test(c.data)){p=A.duplicate();s=p.text.replace(/\r\n/g,"\r").length;for(s=p.moveStart("character",s);p.compareEndPoints("StartToEnd",p)==-1;){s++;p.moveStart("character",1)}}else s=A.text.length;p=new C(c,s)}else{c=(y||!s)&&n.previousSibling;p=(s=(y||s)&&n.nextSibling)&&z.isCharacterDataNode(s)?new C(s,0):c&&z.isCharacterDataNode(c)?new C(c,c.length):new C(p,z.getNodeIndex(n))}n.parentNode.removeChild(n);return p}function J(h,n){var s,y,A=h.offset,p=z.getDocument(h.node),v=p.body.createTextRange(),
            c=z.isCharacterDataNode(h.node);if(c){s=h.node;y=s.parentNode}else{s=h.node.childNodes;s=A<s.length?s[A]:null;y=h.node}p=p.createElement(ant_node);p.innerHTML="&#feff;";s?y.insertBefore(p,s):y.appendChild(p);v.moveToElementText(p);v.collapse(!n);y.removeChild(p);if(c)v[n?"moveStart":"moveEnd"]("character",A);return v}k.requireModules(["DomUtil","DomRange"]);var K,z=k.dom,C=z.DomPosition,N=k.DomRange;if(k.features.implementsDomRange&&(!k.features.implementsTextRange||!k.config.preferTextRange)){(function(){function h(f){for(var j=
            s.length,r;j--;){r=s[j];f[r]=f.nativeRange[r]}}var n,s=N.rangeProperties,y,A;K=function(f){if(!f)throw Error("Range must be specified");this.nativeRange=f;h(this)};N.createPrototypeRange(K,function(f,j,r,M,o){var u=f.endContainer!==M||f.endOffset!=o;if(f.startContainer!==j||f.startOffset!=r||u){f.setEnd(M,o);f.setStart(j,r)}},function(f){f.nativeRange.detach();f.detached=true;for(var j=s.length,r;j--;){r=s[j];f[r]=null}});n=K.prototype;n.selectNode=function(f){this.nativeRange.selectNode(f);h(this)};
            n.deleteContents=function(){this.nativeRange.deleteContents();h(this)};n.extractContents=function(){var f=this.nativeRange.extractContents();h(this);return f};n.cloneContents=function(){return this.nativeRange.cloneContents()};n.surroundContents=function(f){this.nativeRange.surroundContents(f);h(this)};n.collapse=function(f){this.nativeRange.collapse(f);h(this)};n.cloneRange=function(){return new K(this.nativeRange.cloneRange())};n.refresh=function(){h(this)};n.toString=function(){return this.nativeRange.toString()};
            var p=document.createTextNode("test");z.getBody(document).appendChild(p);var v=document.createRange();v.setStart(p,0);v.setEnd(p,0);try{v.setStart(p,1);y=true;n.setStart=function(f,j){this.nativeRange.setStart(f,j);h(this)};n.setEnd=function(f,j){this.nativeRange.setEnd(f,j);h(this)};A=function(f){return function(j){this.nativeRange[f](j);h(this)}}}catch(c){y=false;n.setStart=function(f,j){try{this.nativeRange.setStart(f,j)}catch(r){this.nativeRange.setEnd(f,j);this.nativeRange.setStart(f,j)}h(this)};
            n.setEnd=function(f,j){try{this.nativeRange.setEnd(f,j)}catch(r){this.nativeRange.setStart(f,j);this.nativeRange.setEnd(f,j)}h(this)};A=function(f,j){return function(r){try{this.nativeRange[f](r)}catch(M){this.nativeRange[j](r);this.nativeRange[f](r)}h(this)}}}n.setStartBefore=A("setStartBefore","setEndBefore");n.setStartAfter=A("setStartAfter","setEndAfter");n.setEndBefore=A("setEndBefore","setStartBefore");n.setEndAfter=A("setEndAfter","setStartAfter");v.selectNodeContents(p);n.selectNodeContents=
            v.startContainer==p&&v.endContainer==p&&v.startOffset==0&&v.endOffset==p.length?function(f){this.nativeRange.selectNodeContents(f);h(this)}:function(f){this.setStart(f,0);this.setEnd(f,N.getEndOffset(f))};v.selectNodeContents(p);v.setEnd(p,3);y=document.createRange();y.selectNodeContents(p);y.setEnd(p,4);y.setStart(p,2);n.compareBoundaryPoints=v.compareBoundaryPoints(v.START_TO_END,y)==-1&v.compareBoundaryPoints(v.END_TO_START,y)==1?function(f,j){j=j.nativeRange||j;if(f==j.START_TO_END)f=j.END_TO_START;
            else if(f==j.END_TO_START)f=j.START_TO_END;return this.nativeRange.compareBoundaryPoints(f,j)}:function(f,j){return this.nativeRange.compareBoundaryPoints(f,j.nativeRange||j)};z.getBody(document).removeChild(p);v.detach();y.detach()})();k.createNativeRange=function(h){h=h||document;return h.createRange()}}else if(k.features.implementsTextRange){K=function(h){this.textRange=h;this.refresh()};K.prototype=new N(document);K.prototype.refresh=function(){var h,n,s=this.textRange;h=s.parentElement();var y=
            s.duplicate();y.collapse(true);n=y.parentElement();y=s.duplicate();y.collapse(false);s=y.parentElement();n=n==s?n:z.getCommonAncestor(n,s);n=n==h?n:z.getCommonAncestor(h,n);if(this.textRange.compareEndPoints("StartToEnd",this.textRange)==0)n=h=L(this.textRange,n,true,true);else{h=L(this.textRange,n,true,false);n=L(this.textRange,n,false,false)}this.setStart(h.node,h.offset);this.setEnd(n.node,n.offset)};K.rangeToTextRange=function(h){if(h.collapsed)return J(new C(h.startContainer,h.startOffset),true);
            else{var n=J(new C(h.startContainer,h.startOffset),true),s=J(new C(h.endContainer,h.endOffset),false);h=z.getDocument(h.startContainer).body.createTextRange();h.setEndPoint("StartToStart",n);h.setEndPoint("EndToEnd",s);return h}};N.copyComparisonConstants(K);var P=function(){return this}();if(typeof P.Range=="undefined")P.Range=K;k.createNativeRange=function(h){h=h||document;return h.body.createTextRange()}}K.prototype.getName=function(){return"WrappedRange"};k.WrappedRange=K;k.createRange=function(h){h=
            h||document;return new K(k.createNativeRange(h))};k.createRangyRange=function(h){h=h||document;return new N(h)};k.createIframeRange=function(h){return k.createRange(z.getIframeDocument(h))};k.createIframeRangyRange=function(h){return k.createRangyRange(z.getIframeDocument(h))};k.addCreateMissingNativeApiListener(function(h){h=h.document;if(typeof h.createRange=="undefined")h.createRange=function(){return k.createRange(this)};h=h=null})});
            rangy.createModule("WrappedSelection",function(k,L){function J(b){return(b||window).getSelection()}function K(b){return(b||window).document.selection}function z(b,d,i){var F=i?"end":"start";i=i?"start":"end";b.anchorNode=d[F+"Container"];b.anchorOffset=d[F+"Offset"];b.focusNode=d[i+"Container"];b.focusOffset=d[i+"Offset"]}function C(b){b.anchorNode=b.focusNode=null;b.anchorOffset=b.focusOffset=0;b.rangeCount=0;b.isCollapsed=true;b._ranges.length=0}function N(b){var d;if(b instanceof j){d=b._selectionNativeRange;
            if(!d){d=k.createNativeRange(c.getDocument(b.startContainer));d.setEnd(b.endContainer,b.endOffset);d.setStart(b.startContainer,b.startOffset);b._selectionNativeRange=d;b.attachListener("detach",function(){this._selectionNativeRange=null})}}else if(b instanceof r)d=b.nativeRange;else if(k.features.implementsDomRange&&b instanceof c.getWindow(b.startContainer).Range)d=b;return d}function P(b){var d=b.getNodes(),i;a:if(!d.length||d[0].nodeType!=1)i=false;else{i=1;for(var F=d.length;i<F;++i)if(!c.isAncestorOf(d[0],
            d[i])){i=false;break a}i=true}if(!i)throw Error("getSingleElementFromRange: range "+b.inspect()+" did not consist of a single element");return d[0]}function h(b,d){var i=new r(d);b._ranges=[i];z(b,i,false);b.rangeCount=1;b.isCollapsed=i.collapsed}function n(b){b._ranges.length=0;if(b.docSelection.type=="None")C(b);else{var d=b.docSelection.createRange();if(d&&typeof d.text!="undefined")h(b,d);else{b.rangeCount=d.length;for(var i,F=c.getDocument(d.item(0)),H=0;H<b.rangeCount;++H){i=k.createRange(F);
            i.selectNode(d.item(H));b._ranges.push(i)}b.isCollapsed=b.rangeCount==1&&b._ranges[0].collapsed;z(b,b._ranges[b.rangeCount-1],false)}}}function s(b,d){var i=b.docSelection.createRange(),F=P(d),H=c.getDocument(i.item(0));H=c.getBody(H).createControlRange();for(var O=0,Z=i.length;O<Z;++O)H.add(i.item(O));try{H.add(F)}catch(ka){throw Error("addRange(): Element within the specified Range could not be added to control selection (does it have layout?)");}H.select();n(b)}function y(b,d,i){this.nativeSelection=
            b;this.docSelection=d;this._ranges=[];this.win=i;this.refresh()}function A(b,d){var i=c.getDocument(d[0].startContainer);i=c.getBody(i).createControlRange();for(var F=0,H;F<rangeCount;++F){H=P(d[F]);try{i.add(H)}catch(O){throw Error("setRanges(): Element within the one of the specified Ranges could not be added to control selection (does it have layout?)");}}i.select();n(b)}function p(b,d){if(b.anchorNode&&c.getDocument(b.anchorNode)!==c.getDocument(d))throw new M("WRONG_DOCUMENT_ERR");}function v(b){var d=
            [],i=new o(b.anchorNode,b.anchorOffset),F=new o(b.focusNode,b.focusOffset),H=typeof b.getName=="function"?b.getName():"Selection";if(typeof b.rangeCount!="undefined")for(var O=0,Z=b.rangeCount;O<Z;++O)d[O]=j.inspect(b.getRangeAt(O));return"["+H+"(Ranges: "+d.join(", ")+")(anchor: "+i.inspect()+", focus: "+F.inspect()+"]"}k.requireModules(["DomUtil","DomRange","WrappedRange"]);k.config.checkSelectionRanges=true;var c=k.dom,f=k.util,j=k.DomRange,r=k.WrappedRange,M=k.DOMException,o=c.DomPosition,u,x,
            B=k.util.isHostMethod(window,"getSelection"),D=k.util.isHostObject(document,"selection"),W=D&&(!B||k.config.preferTextRange);if(W){u=K;k.isSelectionValid=function(b){b=(b||window).document;var d=b.selection;return d.type!="None"||c.getDocument(d.createRange().parentElement())==b}}else if(B){u=J;k.isSelectionValid=function(){return true}}else L.fail("Neither document.selection or window.getSelection() detected.");k.getNativeSelection=u;B=u();var ea=k.createNativeRange(document),$=c.getBody(document),
            X=f.areHostObjects(B,f.areHostProperties(B,["anchorOffset","focusOffset"]));k.features.selectionHasAnchorAndFocus=X;var ca=f.isHostMethod(B,"extend");k.features.selectionHasExtend=ca;var ha=typeof B.rangeCount=="number";k.features.selectionHasRangeCount=ha;var da=false,T=true;f.areHostMethods(B,["addRange","getRangeAt","removeAllRanges"])&&typeof B.rangeCount=="number"&&k.features.implementsDomRange&&function(){var b=document.createElement("iframe");$.appendChild(b);var d=c.getIframeDocument(b);d.open();
            d.write("<html><head></head><body>12</body></html>");d.close();var i=c.getIframeWindow(b).getSelection(),F=d.documentElement.lastChild.firstChild;d=d.createRange();d.setStart(F,1);d.collapse(true);i.addRange(d);T=i.rangeCount==1;i.removeAllRanges();var H=d.cloneRange();d.setStart(F,0);H.setEnd(F,2);i.addRange(d);i.addRange(H);da=i.rangeCount==2;d.detach();H.detach();$.removeChild(b)}();k.features.selectionSupportsMultipleRanges=da;k.features.collapsedNonEditableSelectionsSupported=T;var l=false,E;
            if($&&f.isHostMethod($,"createControlRange")){E=$.createControlRange();if(f.areHostProperties(E,["item","add"]))l=true}k.features.implementsControlRange=l;x=X?function(b){return b.anchorNode===b.focusNode&&b.anchorOffset===b.focusOffset}:function(b){return b.rangeCount?b.getRangeAt(b.rangeCount-1).collapsed:false};var Q;if(f.isHostMethod(B,"getRangeAt"))Q=function(b,d){try{return b.getRangeAt(d)}catch(i){return null}};else if(X)Q=function(b){var d=c.getDocument(b.anchorNode);d=k.createRange(d);d.setStart(b.anchorNode,
            b.anchorOffset);d.setEnd(b.focusNode,b.focusOffset);if(d.collapsed!==this.isCollapsed){d.setStart(b.focusNode,b.focusOffset);d.setEnd(b.anchorNode,b.anchorOffset)}return d};k.getSelection=function(b){b=b||window;var d=b._rangySelection,i=u(b),F=D?K(b):null;if(d){d.nativeSelection=i;d.docSelection=F;d.refresh(b)}else{d=new y(i,F,b);b._rangySelection=d}return d};k.getIframeSelection=function(b){return k.getSelection(c.getIframeWindow(b))};E=y.prototype;if(!W&&X&&f.areHostMethods(B,["removeAllRanges",
            "addRange"])){E.removeAllRanges=function(){this.nativeSelection.removeAllRanges();C(this)};var fa=function(b,d){var i=j.getRangeDocument(d);i=k.createRange(i);i.collapseToPoint(d.endContainer,d.endOffset);b.nativeSelection.addRange(N(i));b.nativeSelection.extend(d.startContainer,d.startOffset);b.refresh()};E.addRange=ha?function(b,d){if(l&&D&&this.docSelection.type=="Control")s(this,b);else if(d&&ca)fa(this,b);else{var i;if(da)i=this.rangeCount;else{this.removeAllRanges();i=0}this.nativeSelection.addRange(N(b));
            this.rangeCount=this.nativeSelection.rangeCount;if(this.rangeCount==i+1){if(k.config.checkSelectionRanges)if((i=Q(this.nativeSelection,this.rangeCount-1))&&!j.rangesEqual(i,b))b=new r(i);this._ranges[this.rangeCount-1]=b;z(this,b,aa(this.nativeSelection));this.isCollapsed=x(this)}else this.refresh()}}:function(b,d){if(d&&ca)fa(this,b);else{this.nativeSelection.addRange(N(b));this.refresh()}};E.setRanges=function(b){if(l&&b.length>1)A(this,b);else{this.removeAllRanges();for(var d=0,i=b.length;d<i;++d)this.addRange(b[d])}}}else if(f.isHostMethod(B,
            "empty")&&f.isHostMethod(ea,"select")&&l&&W){E.removeAllRanges=function(){try{this.docSelection.empty();if(this.docSelection.type!="None"){var b;if(this.anchorNode)b=c.getDocument(this.anchorNode);else if(this.docSelection.type=="Control"){var d=this.docSelection.createRange();if(d.length)b=c.getDocument(d.item(0)).body.createTextRange()}if(b){b.body.createTextRange().select();this.docSelection.empty()}}}catch(i){}C(this)};E.addRange=function(b){if(this.docSelection.type=="Control")s(this,b);else{r.rangeToTextRange(b).select();
            this._ranges[0]=b;this.rangeCount=1;this.isCollapsed=this._ranges[0].collapsed;z(this,b,false)}};E.setRanges=function(b){this.removeAllRanges();var d=b.length;if(d>1)A(this,b);else d&&this.addRange(b[0])}}else{L.fail("No means of selecting a Range or TextRange was found");return false}E.getRangeAt=function(b){if(b<0||b>=this.rangeCount)throw new M("INDEX_SIZE_ERR");else return this._ranges[b]};var Y;if(W)Y=function(b){var d;if(k.isSelectionValid(b.win))d=b.docSelection.createRange();else{d=c.getBody(b.win.document).createTextRange();
            d.collapse(true)}if(b.docSelection.type=="Control")n(b);else d&&typeof d.text!="undefined"?h(b,d):C(b)};else if(f.isHostMethod(B,"getRangeAt")&&typeof B.rangeCount=="number")Y=function(b){if(l&&D&&b.docSelection.type=="Control")n(b);else{b._ranges.length=b.rangeCount=b.nativeSelection.rangeCount;if(b.rangeCount){for(var d=0,i=b.rangeCount;d<i;++d)b._ranges[d]=new k.WrappedRange(b.nativeSelection.getRangeAt(d));z(b,b._ranges[b.rangeCount-1],aa(b.nativeSelection));b.isCollapsed=x(b)}else C(b)}};else if(X&&
            typeof B.isCollapsed=="boolean"&&typeof ea.collapsed=="boolean"&&k.features.implementsDomRange)Y=function(b){var d;d=b.nativeSelection;if(d.anchorNode){d=Q(d,0);b._ranges=[d];b.rangeCount=1;d=b.nativeSelection;b.anchorNode=d.anchorNode;b.anchorOffset=d.anchorOffset;b.focusNode=d.focusNode;b.focusOffset=d.focusOffset;b.isCollapsed=x(b)}else C(b)};else{L.fail("No means of obtaining a Range or TextRange from the user's selection was found");return false}E.refresh=function(b){var d=b?this._ranges.slice(0):
            null;Y(this);if(b){b=d.length;if(b!=this._ranges.length)return false;for(;b--;)if(!j.rangesEqual(d[b],this._ranges[b]))return false;return true}};var ia=function(b,d){var i=b.getAllRanges(),F=false;b.removeAllRanges();for(var H=0,O=i.length;H<O;++H)if(F||d!==i[H])b.addRange(i[H]);else F=true;b.rangeCount||C(b)};E.removeRange=l?function(b){if(this.docSelection.type=="Control"){var d=this.docSelection.createRange();b=P(b);var i=c.getDocument(d.item(0));i=c.getBody(i).createControlRange();for(var F,
            H=false,O=0,Z=d.length;O<Z;++O){F=d.item(O);if(F!==b||H)i.add(d.item(O));else H=true}i.select();n(this)}else ia(this,b)}:function(b){ia(this,b)};var aa;if(!W&&X&&k.features.implementsDomRange){aa=function(b){var d=false;if(b.anchorNode)d=c.comparePoints(b.anchorNode,b.anchorOffset,b.focusNode,b.focusOffset)==1;return d};E.isBackwards=function(){return aa(this)}}else aa=E.isBackwards=function(){return false};E.toString=function(){for(var b=[],d=0,i=this.rangeCount;d<i;++d)b[d]=""+this._ranges[d];return b.join("")};
            E.collapse=function(b,d){p(this,b);var i=k.createRange(c.getDocument(b));i.collapseToPoint(b,d);this.removeAllRanges();this.addRange(i);this.isCollapsed=true};E.collapseToStart=function(){if(this.rangeCount){var b=this._ranges[0];this.collapse(b.startContainer,b.startOffset)}else throw new M("INVALID_STATE_ERR");};E.collapseToEnd=function(){if(this.rangeCount){var b=this._ranges[this.rangeCount-1];this.collapse(b.endContainer,b.endOffset)}else throw new M("INVALID_STATE_ERR");};E.selectAllChildren=
            function(b){p(this,b);var d=k.createRange(c.getDocument(b));d.selectNodeContents(b);this.removeAllRanges();this.addRange(d)};E.deleteFromDocument=function(){if(l&&D&&this.docSelection.type=="Control"){for(var b=this.docSelection.createRange(),d;b.length;){d=b.item(0);b.remove(d);d.parentNode.removeChild(d)}this.refresh()}else if(this.rangeCount){b=this.getAllRanges();this.removeAllRanges();d=0;for(var i=b.length;d<i;++d)b[d].deleteContents();this.addRange(b[i-1])}};E.getAllRanges=function(){return this._ranges.slice(0)};
            E.setSingleRange=function(b){this.setRanges([b])};E.containsNode=function(b,d){for(var i=0,F=this._ranges.length;i<F;++i)if(this._ranges[i].containsNode(b,d))return true;return false};E.toHtml=function(){var b="";if(this.rangeCount){b=j.getRangeDocument(this._ranges[0]).createElement("div");for(var d=0,i=this._ranges.length;d<i;++d)b.appendChild(this._ranges[d].cloneContents());b=b.innerHTML}return b};E.getName=function(){return"WrappedSelection"};E.inspect=function(){return v(this)};E.detach=function(){this.win=
            this.anchorNode=this.focusNode=this.win._rangySelection=null};y.inspect=v;k.Selection=y;k.selectionPrototype=E;k.addCreateMissingNativeApiListener(function(b){if(typeof b.getSelection=="undefined")b.getSelection=function(){return k.getSelection(this)};b=null})});


            //rangy-cssclassapplier.js
            /*
             CSS Class Applier module for Rangy.
             Adds, removes and toggles CSS classes on Ranges and Selections

             Part of Rangy, a cross-browser JavaScript range and selection library
             http://code.google.com/p/rangy/

             Depends on Rangy core.

             Copyright 2011, Tim Down
             Licensed under the MIT license.
             Version: 1.1.2
             Build date: 30 May 2011
            */
            rangy.createModule("CssClassApplier",function(h){function s(a){return a.replace(/^\s\s*/,"").replace(/\s\s*$/,"")}function n(a,b){return a.className&&RegExp("(?:^|\\s)"+b+"(?:\\s|$)").test(a.className)}function t(a,b){if(a.className)n(a,b)||(a.className+=" "+b);else a.className=b}function o(a){return a.className.split(/\s+/).sort().join(" ")}function u(a,b){return o(a)==o(b)}function v(a){for(var b=a.parentNode;a.hasChildNodes();)b.insertBefore(a.firstChild,a);b.removeChild(a)}function w(a,b){var c=
            a.cloneRange();c.selectNodeContents(b);var d=c.intersection(a);d=d?d.toString():"";c.detach();return d!=""}function x(a,b){if(a.attributes.length!=b.attributes.length)return false;for(var c=0,d=a.attributes.length,e,f;c<d;++c){e=a.attributes[c];f=e.name;if(f!="class"){f=b.attributes.getNamedItem(f);if(e.specified!=f.specified)return false;if(e.specified&&e.nodeValue!==f.nodeValue)return false}}return true}function y(a){for(var b=0,c=a.attributes.length;b<c;++b)if(a.attributes[b].specified&&a.attributes[b].name!=
            "class")return true;return false}function z(a,b){if(g.isCharacterDataNode(a))return b==0?!!a.previousSibling:b==a.length?!!a.nextSibling:true;return b>0&&b<a.childNodes.length}function l(a,b,c){var d;if(g.isCharacterDataNode(b))if(c==0){c=g.getNodeIndex(b);b=b.parentNode}else if(c==b.length){c=g.getNodeIndex(b)+1;b=b.parentNode}else d=g.splitDataNode(b,c);if(!d){d=b.cloneNode(false);d.id&&d.removeAttribute("id");for(var e;e=b.childNodes[c];)d.appendChild(e);g.insertAfter(d,b)}return b==a?d:l(a,d.parentNode,
            g.getNodeIndex(d))}function A(a,b){var c=a.nodeType==3,d=c?a.parentNode:a,e=b?"nextSibling":"previousSibling";if(c){if((c=a[e])&&c.nodeType==3)return c}else if((c=d[e])&&a.tagName==c.tagName&&u(a,c)&&x(a,c))return c[b?"firstChild":"lastChild"];return null}function p(a){this.firstTextNode=(this.isElementMerge=a.nodeType==1)?a.lastChild:a;if(this.isElementMerge)this.sortedCssClasses=o(a);this.textNodes=[this.firstTextNode]}function m(a,b,c){this.cssClass=a;this.normalize=b;this.applyToAnytagBody=false;
            a=typeof c;if(a=="string")if(c=="*")this.applyToAnytagBody=true;else this.tagNames=s(c.toLowerCase()).split(/\s*,\s*/);else if(a=="object"&&typeof c.length=="number"){this.tagNames=[];a=0;for(b=c.length;a<b;++a)if(c[a]=="*")this.applyToAnytagBody=true;else this.tagNames.push(c[a].toLowerCase())}else this.tagNames=[q]}h.requireModules(["WrappedSelection","WrappedRange"]);var g=h.dom,q=ant_node,B=function(){function a(b,c,d){return c&&d?" ":""}return function(b,c){if(b.className)b.className=b.className.replace(RegExp("(?:^|\\s)"+
            c+"(?:\\s|$)"),a)}}();p.prototype={doMerge:function(){for(var a=[],b,c,d=0,e=this.textNodes.length;d<e;++d){b=this.textNodes[d];c=b.parentNode;a[d]=b.data;if(d){c.removeChild(b);c.hasChildNodes()||c.parentNode.removeChild(c)}}return this.firstTextNode.data=a=a.join("")},getLength:function(){for(var a=this.textNodes.length,b=0;a--;)b+=this.textNodes[a].length;return b},toString:function(){for(var a=[],b=0,c=this.textNodes.length;b<c;++b)a[b]="'"+this.textNodes[b].data+"'";return"[Merge("+a.join(",")+
            ")]"}};m.prototype={appliesToElement:function(a){return this.applyToAnytagBody||g.arrayContains(this.tagNames,a.tagName.toLowerCase())},getAncestorWithClass:function(a){for(a=a.parentNode;a;){if(a.nodeType==1&&this.appliesToElement(a)&&n(a,this.cssClass))return a;a=a.parentNode}return false},postApply:function(a,b){for(var c=a[0],d=a[a.length-1],e=[],f,j=c,C=d,D=0,E=d.length,k,F,i=0,r=a.length;i<r;++i){k=a[i];if(F=A(k,false)){if(!f){f=new p(F);e.push(f)}f.textNodes.push(k);if(k===c){j=f.firstTextNode;
            D=j.length}if(k===d){C=f.firstTextNode;E=f.getLength()}}else f=null}if(c=A(d,true)){if(!f){f=new p(d);e.push(f)}f.textNodes.push(c)}if(e.length){i=0;for(r=e.length;i<r;++i)e[i].doMerge();b.setStart(j,D);b.setEnd(C,E)}},createContainer:function(a){a=a.createElement(q);a.className=this.cssClass;return a},applyToTextNode:function(a){var b=a.parentNode;if(b.childNodes.length==1&&this.appliesToElement(b))t(b,this.cssClass);else{b=this.createContainer(g.getDocument(a));a.parentNode.insertBefore(b,a);b.appendChild(a)}},
            isRemovable:function(a){return a.tagName.toLowerCase()==q&&s(a.className)==this.cssClass&&!y(a)},undoToTextNode:function(a,b,c){if(!b.containsNode(c)){a=b.cloneRange();a.selectNode(c);if(a.isPointInRange(b.endContainer,b.endOffset)&&z(b.endContainer,b.endOffset)){l(c,b.endContainer,b.endOffset);b.setEndAfter(c)}if(a.isPointInRange(b.startContainer,b.startOffset)&&z(b.startContainer,b.startOffset))c=l(c,b.startContainer,b.startOffset)}this.isRemovable(c)?v(c):B(c,this.cssClass)},applyToRange:function(a){a.splitBoundaries();
            var b=a.getNodes([3],function(f){return w(a,f)});if(b.length){for(var c,d=0,e=b.length;d<e;++d){c=b[d];this.getAncestorWithClass(c)||this.applyToTextNode(c)}a.setStart(b[0],0);c=b[b.length-1];a.setEnd(c,c.length);this.normalize&&this.postApply(b,a)}},applyToSelection:function(a){a=a||window;a=h.getSelection(a);var b,c=a.getAllRanges();a.removeAllRanges();for(var d=c.length;d--;){b=c[d];this.applyToRange(b);a.addRange(b)}},undoToRange:function(a){a.splitBoundaries();var b=a.getNodes([3]),c,d,e=b[b.length-
            1];if(b.length){for(var f=0,j=b.length;f<j;++f){c=b[f];(d=this.getAncestorWithClass(c))&&this.undoToTextNode(c,a,d);a.setStart(b[0],0);a.setEnd(e,e.length)}this.normalize&&this.postApply(b,a)}},undoToSelection:function(a){a=a||window;a=h.getSelection(a);var b=a.getAllRanges(),c;a.removeAllRanges();for(var d=0,e=b.length;d<e;++d){c=b[d];this.undoToRange(c);a.addRange(c)}},isAppliedToRange:function(a){for(var b=a.getNodes([3]),c=0,d=b.length;c<d;++c)if(w(a,b[c])&&!this.getAncestorWithClass(b[c]))return false;
            return true},isAppliedToSelection:function(a){a=a||window;a=h.getSelection(a).getAllRanges();for(var b=a.length;b--;)if(!this.isAppliedToRange(a[b]))return false;return true},toggleRange:function(a){this.isAppliedToRange(a)?this.undoToRange(a):this.applyToRange(a)},toggleSelection:function(a){this.isAppliedToSelection(a)?this.undoToSelection(a):this.applyToSelection(a)},detach:function(){}};m.util={hasClass:n,addClass:t,removeClass:B,hasSameClasses:u,replaceWithOwnChildren:v,elementsHaveSameNonClassAttributes:x,
            elementHasNonClassAttributes:y,splitNodeAt:l};h.CssClassApplier=m;h.createCssClassApplier=function(a,b,c){return new m(a,b,c)}});


            //rangy-selectionsaverestore.js
            /*
             Selection save and restore module for Rangy.
             Saves and restores user selections using marker invisible elements in the DOM.

             Part of Rangy, a cross-browser JavaScript range and selection library
             http://code.google.com/p/rangy/

             Depends on Rangy core.

             Copyright 2011, Tim Down
             Licensed under the MIT license.
             Version: 1.1.2
             Build date: 30 May 2011
            */
            rangy.createModule("SaveRestore",function(h,m){function n(a,g){var e="selectionBoundary_"+ +new Date+"_"+(""+Math.random()).slice(2),c,f=p.getDocument(a.startContainer),d=a.cloneRange();d.collapse(g);c=f.createElement(ant_node);c.id=e;c.style.lineHeight="0";c.style.display="none";c.appendChild(f.createTextNode(q));d.insertNode(c);d.detach();return c}function o(a,g,e,c){if(a=(a||document).getElementById(e)){g[c?"setStartBefore":"setEndBefore"](a);a.parentNode.removeChild(a)}else m.warn("Marker element has been removed. Cannot restore selection.")}
            function r(a,g){return g.compareBoundaryPoints(a.START_TO_START,a)}function k(a,g){var e=(a||document).getElementById(g);e&&e.parentNode.removeChild(e)}h.requireModules(["DomUtil","DomRange","WrappedRange"]);var p=h.dom,q="\ufeff";h.saveSelection=function(a){a=a||window;var g=a.document;if(h.isSelectionValid(a)){var e=h.getSelection(a),c=e.getAllRanges(),f=[],d,j;c.sort(r);for(var b=0,i=c.length;b<i;++b){d=c[b];if(d.collapsed){j=n(d,false);f.push({markerId:j.id,collapsed:true})}else{j=n(d,false);
            d=n(d,true);f[b]={startMarkerId:d.id,endMarkerId:j.id,collapsed:false,backwards:c.length==1&&e.isBackwards()}}}for(b=i-1;b>=0;--b){d=c[b];if(d.collapsed)d.collapseBefore((g||document).getElementById(f[b].markerId));else{d.setEndBefore((g||document).getElementById(f[b].endMarkerId));d.setStartAfter((g||document).getElementById(f[b].startMarkerId))}}e.setRanges(c);return{win:a,doc:g,rangeInfos:f,restored:false}}else m.warn("Cannot save selection. This usually happens when the selection is collapsed and the selection document has lost focus.")};
            h.restoreSelection=function(a,g){if(!a.restored){for(var e=a.rangeInfos,c=h.getSelection(a.win),f=[],d=e.length,j=d-1,b,i;j>=0;--j){b=e[j];i=h.createRange(a.doc);if(b.collapsed)if(b=(a.doc||document).getElementById(b.markerId)){b.style.display="inline";var l=b.previousSibling;if(l&&l.nodeType==3){b.parentNode.removeChild(b);i.collapseToPoint(l,l.length)}else{i.collapseBefore(b);b.parentNode.removeChild(b)}}else m.warn("Marker element has been removed. Cannot restore selection.");else{o(a.doc,i,b.startMarkerId,
            true);o(a.doc,i,b.endMarkerId,false)}d==1&&i.normalizeBoundaries();f[j]=i}if(d==1&&g&&h.features.selectionHasExtend&&e[0].backwards){c.removeAllRanges();c.addRange(f[0],true)}else c.setRanges(f);a.restored=true}};h.removeMarkerElement=k;h.removeMarkers=function(a){for(var g=a.rangeInfos,e=0,c=g.length,f;e<c;++e){f=g[e];if(f.collapsed)k(a.doc,f.markerId);else{k(a.doc,f.startMarkerId);k(a.doc,f.endMarkerId)}}}});


            //rangy-serializer.js
            /*
             Serializer module for Rangy.
             Serializes Ranges and Selections. An example use would be to store a user's selection on a particular page in a
             cookie or local storage and restore it on the user's next visit to the same page.

             Part of Rangy, a cross-browser JavaScript range and selection library
             http://code.google.com/p/rangy/

             Depends on Rangy core.

             Copyright 2011, Tim Down
             Licensed under the MIT license.
             Version: 1.1.2
             Build date: 30 May 2011
            */
            rangy.createModule("Serializer",function(h,n){function o(c,a){a=a||[];var b=c.nodeType,e=c.childNodes,d=e.length,f=[b,c.nodeName,d].join(":"),g="",k="";switch(b){case 3:g=c.nodeValue.replace(/</g,"&lt;").replace(/>/g,"&gt;");break;case 8:g="<!--"+c.nodeValue.replace(/</g,"&lt;").replace(/>/g,"&gt;")+"--\>";break;default:g="<"+f+">";k="</>";break}g&&a.push(g);for(b=0;b<d;++b)o(e[b],a);k&&a.push(k);return a}function j(c){c=o(c).join("");return u(c).toString(16)}function l(c,a,b){var e=[],d=c;for(b=
            b||i.getDocument(c).documentElement;d&&d!=b;){e.push(i.getNodeIndex(d,true));d=d.parentNode}return e.join("/")+":"+a}function m(c,a,b){if(a)b||i.getDocument(a);else{b=b||document;a=b.documentElement}c=c.split(":");a=a;b=c[0]?c[0].split("/"):[];for(var e=b.length,d;e--;){d=parseInt(b[e],10);if(d<a.childNodes.length)a=a.childNodes[parseInt(b[e],10)];else throw n.createError("deserializePosition failed: node "+i.inspectNode(a)+" has no child with index "+d+", "+e);}return new i.DomPosition(a,parseInt(c[1],
            10))}function p(c,a,b){b=b||h.DomRange.getRangeDocument(c).documentElement;if(!i.isAncestorOf(b,c.commonAncestorContainer,true))throw Error("serializeRange: range is not wholly contained within specified root node");c=l(c.startContainer,c.startOffset,b)+","+l(c.endContainer,c.endOffset,b);a||(c+="{"+j(b)+"}");return c}function q(c,a,b){if(a)b=b||i.getDocument(a);else{b=b||document;a=b.documentElement}c=/^([^,]+),([^,\{]+)({([^}]+)})?$/.exec(c);var e=c[4],d=j(a);if(e&&e!==j(a))throw Error("deserializeRange: checksums of serialized range root node ("+
            e+") and target root node ("+d+") do not match");e=m(c[1],a,b);a=m(c[2],a,b);b=h.createRange(b);b.setStart(e.node,e.offset);b.setEnd(a.node,a.offset);return b}function r(c,a,b){if(a)b||i.getDocument(a);else{b=b||document;a=b.documentElement}c=/^([^,]+),([^,]+)({([^}]+)})?$/.exec(c)[3];return!c||c===j(a)}function s(c,a,b){c=c||rangy.getSelection();c=c.getAllRanges();for(var e=[],d=0,f=c.length;d<f;++d)e[d]=p(c[d],a,b);return e.join("|")}function t(c,a,b){if(a)b=b||i.getWindow(a);else{b=b||window;a=
            b.document.documentElement}c=c.split("|");for(var e=h.getSelection(b),d=[],f=0,g=c.length;f<g;++f)d[f]=q(c[f],a,b.document);e.setRanges(d);return e}h.requireModules(["WrappedSelection","WrappedRange"]);if(typeof encodeURIComponent=="undefined"||typeof decodeURIComponent=="undefined")n.fail("Global object is missing encodeURIComponent and/or decodeURIComponent method");var u=function(){var c=null;return function(a){for(var b=[],e=0,d=a.length,f;e<d;++e){f=a.charCodeAt(e);if(f<128)b.push(f);else f<
            2048?b.push(f>>6|192,f&63|128):b.push(f>>12|224,f>>6&63|128,f&63|128)}a=-1;if(!c){e=[];d=0;for(var g;d<256;++d){g=d;for(f=8;f--;)if((g&1)==1)g=g>>>1^3988292384;else g>>>=1;e[d]=g>>>0}c=e}e=c;d=0;for(f=b.length;d<f;++d){g=(a^b[d])&255;a=a>>>8^e[g]}return(a^-1)>>>0}}(),i=h.dom;h.serializePosition=l;h.deserializePosition=m;h.serializeRange=p;h.deserializeRange=q;h.canDeserializeRange=r;h.serializeSelection=s;h.deserializeSelection=t;h.canDeserializeSelection=function(c,a,b){var e;if(a)e=b?b.document:
            i.getDocument(a);else{b=b||window;a=b.document.documentElement}c=c.split("|");b=0;for(var d=c.length;b<d;++b)if(!r(c[b],a,e))return false;return true};h.restoreSelectionFromCookie=function(c){c=c||window;var a;a:{a=c.document.cookie.split(/[;,]/);for(var b=0,e=a.length,d;b<e;++b){d=a[b].split("=");if(d[0].replace(/^\s+/,"")=="rangySerializedSelection")if(d=d[1]){a=decodeURIComponent(d.replace(/\s+$/,""));break a}}a=null}a&&t(a,c.doc)};h.saveSelectionCookie=function(c,a){c=c||window;a=typeof a=="object"?
            a:{};var b=a.expires?";expires="+a.expires.toUTCString():"",e=a.path?";path="+a.path:"",d=a.domain?";domain="+a.domain:"",f=a.secure?";secure":"",g=s(rangy.getSelection(c));c.document.cookie=encodeURIComponent("rangySerializedSelection")+"="+encodeURIComponent(g)+b+e+d+f};h.getElementChecksum=j});


            //keep this return here - this is how we pass the rangy object to the rest of the code.
            //Rangy assumes it to be global, but it's better to keep the pub's namespace clean.
            return rangy;
        }
        //end function plugin_rangy()

        /** end plugin functions **/
    }
    //end initPlugins()

    //if we're offline, expose stuff to window for testing
    if(ANT_offline){
        ANT.debug();
    }
}
//end $AFunctions()

})();
