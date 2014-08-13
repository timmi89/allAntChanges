;(function(){
//dont bother indenting this top level anonymous function

var RDR = {};
if(window.READRBOARDCOM && window.READRBOARDCOM.hasLoaded){
    window.READRBOARDCOM.actions.reInit();
    return;
}

//READRBOARDCOM and readrboard will now be the only things in the global namespace
window.READRBOARDCOM = window.readrboard = RDR;

RDR.hasLoaded = true;

/*some constants that we need for now*/
RDR.C = {
    /*tied to div.rdr div.rdr_tag height*/
    // summaryWidgetMaxHeight: 68,
     //+ header height + extra padding;
    rindowHeaderPadding: 29,
    rindowWidthForKindIsText: 200,
    rindowAnimationSpeed: 333,
    indicatorOpacity: 0.4,
    helperIndicators: {
        hoverDelay: 250,
        fadeInTime: 300,
        opacity: 0.6
    }
}

RDR.engageScript = document.getElementById("readrboardscript") || findEngageScript();
RDR.engageScriptSrc = RDR.engageScript.src;

//todo: clean these up
var $RDR, //our global $RDR object (jquerified RDR object for attaching data and queues and such)
$R, //init var: our clone of jQuery
RDR_scriptPaths = {},
//check if this script is the offline version
//note that the other RDR_offline vars in our iframes should check window.location for local.readrboard.com instead
RDR_offline = !!(
    RDR.engageScriptSrc.indexOf('local.readrboard.com') != -1 ||
    RDR.engageScriptSrc.indexOf('local.readrboard2.com') != -1 ||
    document.domain == "local.readrboard.com" //shouldn't need this line anymore
),
RDR_baseUrl = ( RDR_offline ) ? window.location.protocol + "//local.readrboard.com:8081":window.location.protocol + "//www.readrboard.com",
RDR_staticUrl = ( RDR_offline ) ? window.location.protocol + "//local.readrboard.com:8081/static/":window.location.protocol + "//s3.amazonaws.com/readrboard/",
RDR_widgetCssStaticUrl = ( RDR_offline ) ? window.location.protocol + "//local.readrboard.com:8081/static/":window.location.protocol + "//s3.amazonaws.com/readrboard/";

var isTouchBrowser = (
    ('ontouchstart' in window) || 
    (window.DocumentTouch && document instanceof DocumentTouch)
);

RDR.safeThrow = function(msg){
    //this will never actually throw in production (if !RDR_offline)
    //this is used for errors that aren't stopship, but are definitely wrong behavior.
    //set localDebug to true if you want to catch these while developing.
    var debugMode = false;

    if(RDR_offline && debugMode){
        // [porter]  changing to log so that acceptable, trivial bugs are not blockers, but do get logged
        console.log(msg);
        // throw msg;
    }
};

//temp for testing
function test_readrboard_extend(){
    //for saftey
    if(!RDR_offline){
        return;
    }
    window.readrboard_extend = {
        default_reactions: [
            "Love It",
            "Hate It",
            "Heeeeeey"
        ]
    };
    window.readrboard_extend_per_container = {
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
// test_readrboard_extend();

//this doesn't need to run if we have an id on the script
function findEngageScript(){
    var scripts = document.getElementsByTagName('script')

    for(var i=0; i<scripts.length; i++){
        var s = scripts[i];
        var src = s.src;
        //not looking for readrboard.com right now in case we use the amazon version without an id on the script
        var isReadrBoardScript = (
            src.indexOf('readrboard') != -1 &&
            src.indexOf('engage') != -1
        );
        if(isReadrBoardScript){
            return s;
        }
    }
}

function readrBoard($R){
    var $ = $R;

    $.extend(RDR, {
        summaries:{},
        current: {}, //todo: what is this? delete it?
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
            //RDR.group:
            //details to be set by RDR.actions.initGroupData which extends defaults
            defaults: {
                premium: false,
                img_selector: "img",
                img_container_selectors:"#primary-photo",
                active_sections: "body",
                anno_whitelist: "body p",
                active_sections_with_anno_whitelist:"",
                media_selector: "embed, video, object, iframe",
                comment_length: 500,
                /*this is basically not used right now*/
                initial_pin_limit: 300,
                no_readr: "",
                img_blacklist: "",
                custom_css: "",
                call_to_action: "What do you think?",
                //todo: temp inline_indicator defaults to make them show up on all media - remove this later.
                inline_selector: 'img, embed, video, object, iframe',
                paragraph_helper: true,
                media_url_ignore_query: true,
                summary_widget_method: 'after',
                //the scope in which to find parents of <br> tags.  
                //Those parents will be converted to a <rt> block, so there won't be nested <p> blocks.
                //then it will split the parent's html on <br> tags and wrap the sections in <p> tags.
                
                //example:
                // br_replace_scope_selector: ".rdr_br_replace" //e.g. "#mainsection" or "p"
                
                br_replace_scope_selector: null //e.g. "#mainsection" or "p"
            }
        },
        user: {
            img_url: "",
            readr_token: "",
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
                RDR.events.trackEventToCloud({
                    event_type: event_type,
                    event_value: milestone
                });

            },
            fireEventQueue: function() {
                $.each( RDR.events.queue, function(idx, event_params) {
                    RDR.events.trackEventToCloud(event_params);
                });
            },
            checkTime: function() {
                if ( document.hasFocus() === true ){
                    if ( RDR.events.focusedSeconds > 0 && RDR.events.focusedSeconds % 20 == 0 ) {  // && RDR.events.justFocused === false 
                        RDR.events.trackEventToCloud({
                            event_type: 'ti',
                            event_value: RDR.events.focusedSeconds.toString()
                        });
                    }
                    RDR.events.focusedSeconds++;
                    // if (RDR.events.justFocused === false ) {
                    //     RDR.events.focusedSeconds++;
                    // } else {
                    //     RDR.events.justFocused = false;
                    // }
                }
            },
            // track : function( data, hash ) {
                // RDR.events.track:
                
                // var standardData = "",
                //     timestamp = new Date().getTime();
                
                // RDR.user = RDR.user || {};
                
                // if ( RDR.user && RDR.user.user_id ) standardData += "||uid::"+RDR.user.user_id;
                // if ( hash && RDR.util.getPageProperty('id', hash) ) standardData += "||pid::"+RDR.util.getPageProperty('id', hash);
                // if ( RDR.group && RDR.group.id ) standardData += "||gid::"+RDR.group.id;
                // if ( RDR.engageScriptParams.bookmarklet ) standardData += "||bookmarklet";

                // var eventSrc = data+standardData,
                //     $event = $('<img src="'+RDR_baseUrl+'/static/widget/images/event.png?'+timestamp+'&'+eventSrc+'" />'); // NOT using STATIC_URL b/c we need the request in our server logs, and not on S3's logs

                // $('#rdr_event_pixels').append($event);

            // },
            trackEventToCloud: function( params ) {
                // RDR.events.trackEventToCloud

                RDR.user = RDR.user || {};
                RDR.events.queue = RDR.events.queue || [];

                if (RDR.events.recordEvents && typeof params.event_type !== 'undefined' && params.event_value !== 'undefined'){

                    var page_id = ( (typeof params.page_id != 'undefined') ? params.page_id : RDR.util.getPageProperty('id') ).toString();
                    
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
                            ref : referrer_tld
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
                            gid: RDR.group.id || null,
                            uid: RDR.user.user_id || null,
                            pid: parseInt(page_id),
                            lts: RDR.user.lts || null,
                            sts: RDR.user.sts || null,
                            ref: referrer_tld || null,
                            cid: params.content_id || null,
                            ah: parseInt(RDR.group.active_section_milestones[100]) || null,
                            ch: params.container_hash || null,
                            ck: params.container_kind || null,
                            r: params.reaction_body || null,
                            pt: RDR.util.getPageProperty('title') || null,
                            cu: RDR.util.getPageProperty('canonical_url') || null,
                            pu: RDR.util.getPageProperty('page_url') || null,
                            ru: referrer_url || null,
                            ca: params.content_attributes || null,  // what is this for?
                            cl: params.content_location || null,  
                            ptop: RDR.group.topics || null,
                            a: RDR.group.author || null,
                            sec: RDR.group.section || null,
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
                              rindow_show   :     rs
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

                    if ( typeof RDR.group.xdmLoaded != 'undefined' && RDR.group.xdmLoaded === true ) {
                        $.postMessage(
                            "register-event::"+data,
                            RDR_baseUrl + "/static/xdm.html",
                            window.frames['rdr-xdm-hidden']
                        );
                    } else {
                        RDR.events.queue.push(params);
                    }
                }
            },
            emit: function(eventName, eventValue, eventSupplementary) {
                // RDR.events.emit
                if (RDR.group.premium == true) {
                    // non-IE
                    RDR.events.lastEvent = eventName;
                    RDR.events.lastValue = eventValue;
                    RDR.events.lastSupplementary = eventSupplementary;

                    if (document.createEvent) {
                        evt = document.createEvent("Event");
                        evt.initEvent(eventName, true, true);
                        document.dispatchEvent(evt);
                    } else if (document.createEventObject) { // MSIE
                        // just change the property 
                        // this will trigger onpropertychange
                        document.documentElement[eventName]++;
                    };
                }
            }
        },
        groupSettings: {
            getCustomSettings: function(){
                //RDR.groupSettings.getCustomSettings:

                // grab anything on the page
                var group_extensions = window.readrboard_extend || {};

                // handle deprecated "blessed_tags"
                if ( typeof group_extensions.blessed_tags != 'undefined' ) {
                    // use .slice() to copy by value
                    // http://stackoverflow.com/questions/7486085/copying-array-by-value-in-javascript
                    group_extensions.default_reactions = group_extensions.blessed_tags.slice();
                    delete group_extensions.blessed_tags;
                }

                // grab anything from the URL
                // example usage:  rdr_hideOnMobile=false&rdr_doubleTapMessage=%27hello%20world%27
                var qs = RDR.util.getQueryParams(),
                    group_qs_extensions = {};

                $.each(qs, function(key, val){
                    if ( key.indexOf('rdr_') === 0 ) {
                        key = key.substr(4);
                        group_qs_extensions[key] = val;
                    }
                });       

                group_extensions = $.extend({}, group_extensions, group_qs_extensions );

                //the translations just make for a nicer api.  If no translation is defined for a setting, it returns the given value.
                return RDR.groupSettings._translate(group_extensions);
            },
            translators: {
                default_reactions: function(tagsList){
                    // because our API returns this in the form  "blessed_tags": [{ "body": "Love It",  "id": 368}...] 
                    // modified to reference 'default_reactions' instead of 'blessed_tags'
                    return $.map(tagsList, function(val, idx){
                        return {body: val};
                    });
                }
            },
            _translate: function(settings){
                //RDR.groupSettings._translate:
                var ret_settings = {};
                var translators = RDR.groupSettings.translators;
                $.each(settings, function(key, val){
                    ret_settings[key] = !!translators[key] ? translators[key](val) : val;
                });
                return ret_settings;
            },
            getBlessedTags: function(hash){
                //RDR.groupSettings.getBlessedTags:

                // return blessed tags for this hash, if they exist...
                var perContainerSettings = window.readrboard_extend_per_container;
                if(hash && perContainerSettings){
                    var name = getCustomRDRItems(hash);
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
                        var settings = RDR.groupSettings._translate(perContainerExtentions);
                        return settings.default_reactions;
                    }
                }

                function getCustomRDRItems(hash){
                    var $el = $('[rdr-hash="' + hash + '"]');
                    var name = $el.attr('rdr-item');
                    return name;
                }

                // otherwise, return the reactions that are set on the page
                // via Admin or via window.readrboard_extend object
                return RDR.group.default_reactions;
            }
        },
        rindow: {
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
                minWidth: 100,
                maxWidth: 600,
                forceHeight: false,
                rewritable: true
            },
            makeHeader: function( _headerText, interactionId ) {
                //RDR.rindow.makeHeader:
                var headerText = _headerText || "";

                var headerTml = $.mustache(
                    '<div class="rdr rdr_header">'+
                        '<div class="rdr_header_arrow">'+
                            '<img src="{{RDR_staticUrl}}widget/images/header_up_arrow.png" />'+
                        '</div>'+
                        '<div class="rdr_loader"></div>'+
                        '<div class="rdr_about"><a href="http://www.readrboard.com/" target="_blank">&nbsp;</a></div>'+
                        '<div class="rdr_indicator_stats">'+
                            '<img class="no-rdr rdr_pin" src="{{RDR_staticUrl}}widget/images/blank.png">'+
                            '<span class="rdr_count"></span>'+
                        '</div>' +
                        '<h1>{{headerText}}</h1>'+
                    '</div>'
                ,{
                    RDR_staticUrl: RDR_staticUrl,
                    headerText: headerText
                });

                var $header = $(headerTml);
                if(!interactionId){
                    return $header;
                }

               
                var $menuDropdownActions = $(
                    '<div class="rdr_menuDropDown rdr_menu_actions">'+
                        '<span class="rdr_icon-chevron-down rdr_menuTrigger"></span>'+
                    '</div>'
                );
                var $menuActions = makeActionList();
                $menuDropdownActions.append($menuActions);

                var $menu = $('<div class="rdr_rindowMenu"></div>').append($menuDropdownActions);
                // $menu.append($menuActions);
                if(isTouchBrowser){
                    $menu.on('tap', '.rdr_menuDropDown', function(){
                        $(this).toggleClass('rdr_hover');
                    });
                }

                $header.append($menu);
    
                function makeActionList(){
                    var $links = $(
                        '<div class="rdr_linkWrap">'+
                            '<ul>'+
                                '<li class="rdr_link">'+
                                    '<a href="javascript:void(0);" class="rdr_undo_link">Remove reaction</a>'+
                                '</li>'+
                                '<li class="rdr_link">'+
                                    '<a target="_blank" href="'+RDR_baseUrl+'/interaction/'+interactionId+'" class="rdr_seeit_link">View at ReadrBoard</a>'+
                                '</li>'+
                            '</ul>'+
                        '</div>'
                    );
                    return $links;
                }

                return $header;
            },
            makeDefaultPanelMessage: function( $rindow, _kind ) {
                //RDR.rindow.makeDefaultPanelMessage:

                var hash = $rindow.data('hash');
                var summary = RDR.summaries[hash];
                var kind = _kind || (
                    $rindow.hasClass('rdr_indicator_details') ?
                    "media" :
                    "text"
                );

                var headerText;

                if( kind == "text" ){
                    if ( $rindow.data('mode') == "writeMode" ) {
                        headerText = "What do you think?";
                    } else {
                        if (kind=="text") {
                            headerText = 'Reactions';
                        } else {
                            headerText = (summary.counts.tags>0) ? summary.counts.tags + " Reactions":"Reactions";
                        }
                    }

                }else{
                    //note: $rindow is the $indicator_details

                    //confirm if we still need this.
                    var modForIE = ( $.browser.msie && parseInt( $.browser.version, 10 ) < 9 ) ? 20:0;
                    headerText = (summary.counts.tags>0) ? 
                            summary.counts.tags + " Reactions" :
                            ($rindow.width()>=(175+modForIE)) ? 
                                "What do you think?":
                                "React:";
                }

                return headerText;
            },
            updateFooter: function( $rindow, $content ) {
                //RDR.rindow.updateFooter:
                var $footer = $rindow.find('div.rdr_footer');
                $footer.show(0);
                if ( typeof $content != "undefined" ) $footer.html( $content );
                
                //todo: examine resize
                // RDR.rindow.updateSizes( $rindow );
            },
            hideFooter: function( $rindow ) {
                //RDR.rindow.hideFooter:
                $rindow.find('div.rdr_footer').hide(0);
                
                //todo: examine resize
                // RDR.rindow.updateSizes( $rindow );
            },
            panelCreate: function( $rindow, className ) {
                //RDR.rindow.panelCreate
                // later, I want to add the ability for this to create an absolutely-positioned panel
                // that will slide OVER, not next to, current content... like a login panel sliding over the content.

                // create a new panel for the rindow
                if ( !$rindow ) return;

                var $rdr_body_wrap = $rindow.find('div.rdr_body_wrap'),
                    $rdr_bodyFirst = $rdr_body_wrap.find('div.rdr_body').eq(0);

                //not sure if this will ever happen - could just be legacy stuff
                var $existingPanel = $rdr_body_wrap.find('div.'+className);
                $existingPanel.remove();

                var $newPanel = $('<div class="rdr_body '+className+'"/>'),
                        column_count = ( $rdr_body_wrap.find('div.rdr_body').length ) + 1;
        
                return $newPanel;
            },
            panelUpdate: function( $rindow, className, $newPanel, shouldAppendNotReplace ) {
                //RDR.rindow.panelUpdate:

                if ( !$rindow ) return;
                var $rdr_body_wrap = $rindow.find('div.rdr_body_wrap'),
                    $panel = $rdr_body_wrap.find('div.'+className);

                if (shouldAppendNotReplace){
                    $panel.append( $newPanel );
                }else{
                    // replacewith bug
                    $panel.replaceWith( $newPanel );
                }
                return $newPanel;
            },

            panelShow: function( $rindow, $showPanel, callback ) {
                //RDR.rindow.panelShow: 
                // panelEvent - panelShow
                
                var $panelWrap = $rindow.find('.rdr_body_wrap');
                var $hidePanel = $rindow.find('.rdr_visiblePanel');
                //do this for now, because there are too many places in the code to add this correctly
                if(!$hidePanel.length){
                    $hidePanel = $rindow.find('.rdr_body').eq(0);
                }

                var animWidth = $hidePanel.width();

                // reflow opportunity
                $showPanel
                    .show()
                    .addClass('rdr-visible')
                    .css({
                        position: 'relative',
                        top: 0,
                        left: animWidth
                    });

                $rindow.data('panelState', 2);
                $showPanel.addClass('rdr_visiblePanel').removeClass('rdr_hiddenPanel');
                $hidePanel.addClass('rdr_hiddenPanel').removeClass('rdr_visiblePanel');

                //update the size at the same time so the animations run in parallel
                RDR.rindow.updateSizes( $rindow );
                $panelWrap.animate({
                      left: -animWidth
                  },
                  RDR.C.rindowAnimationSpeed,
                  function() {
                      if (callback) callback();
                      if ( $rindow.data('jsp') ) {
                          var API = $rindow.data('jsp');
                          // why can't i make this use the WIDTH that is already set?  it keeps resizing the jscrollpane to will the space
                          API.reinitialise();
                      } else {
                          $rindow.jScrollPane({ showArrows:true });
                      }
                  }
                );
            },
            panelHide: function( $rindow, callback ) {
                //RDR.rindow.panelHide:
                
                // panelEvent - panelhide
                var $panelWrap = $rindow.find('.rdr_body_wrap');

                var isWriteMode = $rindow.hasClass('rdr_writemode'),
                    $tagsListContainer = RDR.actions.indicators.utils.makeTagsListForInline( $rindow, isWriteMode );
                
                var className = "rdr_tags_list";
                var $hidePanel = $rindow.find('.rdr_visiblePanel');
                $hidePanel.removeClass('rdr_visiblePanel').addClass('rdr_hiddenPanel');

                // replacewith bug
                // var $showPanel = RDR.rindow.panelUpdate($rindow, className, $tagsListContainer );
                // $showPanel.addClass('rdr_visiblePanel').removeClass('rdr_hiddenPanel');
                $tagsListContainer.addClass('rdr_visiblePanel').removeClass('rdr_hiddenPanel');
                
                // var animWidth = $showPanel.width();
                var animWidth = $tagsListContainer.width();
                $hidePanel.css('left', animWidth);
                $panelWrap.css('left', -animWidth);

                //update the size at the same time so the animations run in parallel
                RDR.rindow.updateSizes( $rindow );
                $panelWrap.animate({
                    left: 0
                },
                RDR.C.rindowAnimationSpeed,
                function() {
                    if (callback) callback();
                    $rindow.data('panelState', 1);
                    
                    if ( $rindow.data('jsp') ) {
                        var API = $rindow.data('jsp');
                        // why can't i make this use the WIDTH that is already set?  it keeps resizing the jscrollpane to will the space
                        API.reinitialise();
                    } else {
                        $rindow.jScrollPane({ showArrows:true });
                    }

                });
            },
            panelEnsureFloatWidths: function( $rindow ) {
                //RDR.rindow.panelEnsureFloatWidths:

                //this function keeps messing stuff up and causing the rindow panel to jump.
                //we shouldn't need it anyway while the success state just has a close button instead of a back button
                return;

                //this is needed becuase after the tagList updates, the width of panel1 can change.
                // var $panelWrap = $rindow.find('.rdr_body_wrap');
                // var $showPanel = $rindow.find('.rdr_visiblePanel');
                // var $hidePanel = $rindow.find('.rdr_hiddenPanel');

                // var xOffset = $hidePanel.width();

                // $panelWrap.css({
                //     left: -xOffset
                // });
                // $showPanel.css({
                //     left: xOffset
                // });

            },
            //somewhat hacky function to reliably update the tags and ensure that the panel hide and show work
            updateTagPanel: function ( $rindow ) {
                // RDR.rindow.updateTagPanel:
                // panelEvent - backButton

                var hash = $rindow.data('hash');

                RDR.rindow.panelHide( $rindow );
                RDR.rindow.tagBox.setWidth( $rindow, $rindow.data('initialWidth') );
                RDR.rindow.tagBox.setHeight( $rindow, $rindow.data('initialHeight') );

            },

            mediaRindowShow: function ( $mediaItem ) {
                //RDR.rindow.mediaRindowShow
                var hash = $mediaItem.data('hash'),
                    $rindow = $('#rdr_indicator_details_'+hash);


                RDR.util.cssSuperImportant($rindow, {
                    display:"block",
                });
                // check to see if the hover event has already occurred (.data('hover')
                // and whether either of the two elements that share this same hover event are currently hovered-over
                //not sure we need all this logic anymore
                if ( $mediaItem.data('hover') && !$rindow.data('hover') && !$rindow.is(':animated') && !$rindow.closest('div.rdr_media_details').length ) {
                    $rindow.data('hover',true);
                    RDR.rindow.updateSizes( $rindow );
                }
                $rindow.addClass('rdr_engaged')
            },
            mediaRindowHide: function ( $mediaItem ) {
                //RDR.rindow.mediaRindowHide:
                var hash = $mediaItem.data('hash'),
                    $rindow = $('#rdr_indicator_details_'+hash);

                if ( !$mediaItem.data('hover') && !$rindow.is(':animated') && !$rindow.closest('div.rdr_media_details').length ) {
                    $rindow.data('hover', false).animate( {'height':'0px' }, RDR.C.rindowAnimationSpeed, function() {
                        // $rindow.removeClass('rdr_has_border');
                        RDR.util.cssSuperImportant($rindow, {
                            display:"none",
                        });
                    });
                }
                $rindow.removeClass('rdr_engaged');
                $('#rdr_indicator_' + hash).hide();
            },
            updateSizes: function($rindow, _options) {
                //RDR.rindow.updateSizes:
                // options are {
                //     setWidth,
                //     setHeight,
                //     noAnimate
                // }

                //_kind should not need to be set manually
                var kind = (
                    $rindow.hasClass('rdr_indicator_details') ?
                    "media" :
                    "text"
                );

                var options = _options || {};

                var $elm = $rindow.find('.rdr_visiblePanel');

                // var $jsPane = $elm.find('div.jspPane');
                var initialWidth = $rindow.data('initialWidth'),
                    initialHeight = $rindow.data('initialHeight');

                var width,
                    height;

                //fix this later.  We should be expanding only the body instead of the whole thing so we dont need this.
                //note - includes padding
                var rindowHeaderHeight = 0;

                var defaults = {
                    h: 200,
                    w: 200,
                    duration: RDR.C.rindowAnimationSpeed
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
                    $rindow.css({
                        width: width,
                        height: height
                    });
                }
                $rindow.animate({
                    width: width,
                    height: height
                },{
                    duration: defaults.duration,
                    queue:false
                });

                RDR.rindow.jspUpdate($rindow);
            },
            updatePageTagMessage: function(args, action) {
                if(action == 'tagDeleted'){
                    var $rindow = $('div.rdr_window:eq(0)');
                    RDR.rindow.hideFooter($rindow);
                    $rindow.find('.rdr_header h1').text('Reaction Undone');
                    $rindow.find('.rdr_body').css('height','auto').html(
                        '<div class="rdr_reactionMessage rdr_reactUndoSuccess">'+
                            '<div class="rdr_label_icon"></div>'+
                            '<em>'+
                                '<span>Your Reaction: </span>'+
                                '<strong> '+args.tag.body+' </strong>'+
                                '<span>has been undone.</span>'+
                            '</em>'+
                        '</div>' 
                    );
                }
            },
            updateTagMessage: function(args) {
                //RDR.rindow.updateTagMessage
                // used for updating the message in the rindow that follows a reaction
                if ( args.scenario && args.rindow ) {
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
                        $rindow = args.rindow,
                        kind = args.kind,
                        tag = args.tag,
                        summary = RDR.summaries[hash],
                        content_node = (args.sendData)?args.sendData.content_node_data:{};

                    RDR.rindow.tagBox.setWidth( $rindow, 320 );

                    if ( args.scenario != "tagDeleted" ) {
                        if ( args.scenario == "reactionSuccess" || args.scenario == "reactionExists" ) {

                                var $success = $('<div class="rdr_view_success"></div>'),
                                    $subheader = $('<div class="rdr_subheader rdr_clearfix"></div>').appendTo( $success ),
                                    tagBody = ( tag.body ) ? tag.body:tag.tag_body,
                                    $h1 = $('<h1>'+tagBody+'</h1>').appendTo( $subheader ),
                                    $options = $('<div class="rdr_nextActions"></div>').appendTo( $success );
                                
                                if ( args.kind != 'page' ) {
                                    var $sayMore = RDR.actions.comments.makeCommentBox({
                                        content_node: content_node,
                                        summary: summary,
                                        hash: hash,
                                        tag: tag,
                                        kind: kind,
                                        $rindow: $rindow,
                                        selState: content_node.selState || null
                                    }).appendTo( $options );
                                }

                                // if ( kind != "text" ) {
                                    var $backButton = $('<div class="rdr_back">Close X</div>');
                                    $success.prepend($backButton);
                                    $backButton.click( function() {

                                        var doClose = RDR.rindow.safeClose($rindow);
                                        if(!doClose){
                                            return;
                                        }

                                        RDR.rindow.updateTagPanel( $rindow );

                                    });
                                // }

                                var shouldAppendNotReplace = true;
                                RDR.rindow.panelUpdate( $rindow, 'rdr_view_more', $success, shouldAppendNotReplace);

                                RDR.user = RDR.user || {};
                                
                                var onAction = function(event){
                                    var args = event.data.args;

                                    // panelEvent - undo1

                                    var newArgs = {
                                        hash: args.hash,
                                        int_id: args.response.data.interaction.id,
                                        tag: args.tag,
                                        rindow: $rindow
                                    };

                                    RDR.actions.interactions.ajax( newArgs, 'react', 'remove' );

                                };

                                if(isTouchBrowser){
                                    $rindow.find('a.rdr_undo_link').on('tap.rdr', {args:args}, onAction);
                                }else{
                                    $rindow.find('a.rdr_undo_link').on('click.rdr', {args:args}, onAction);
                                }

                            function makeShareLinks(){

                                var $shareLinks = $('<div class="rdr_shareLinks">Share your reaction: <ul></ul></div>'),
                                // sns sharing links
                                socialNetworks = ["facebook","twitter"];  //, "tumblr"]; //,"tumblr","linkedin"];

                                // embed icons/links for diff SNS
                                $.each(socialNetworks, function(idx, val){
                                    var $link = $('<li><a href="http://' +val+ '.com" ><i class="rdr_icon-'+val+'"></i></a></li>');
                                    $shareLinks.find('ul').append($link);
                                    $link.click( function() {
                                        
                                        var tag_body = args.tag.tag_body || args.tag.body;
                                        // goddamnit this hack.
                                        if(args.hash.jquery){
                                            content_node.hash = "page";
                                            hash = args.hash = "page";
                                        }

                                        RDR.events.trackEventToCloud({
                                            event_type: "sh",
                                            event_value: val,
                                            container_hash: hash,
                                            container_kind: args.kind,
                                            page_id: args.page_id,
                                            reaction_body: tag_body
                                        });

                                        var summary = RDR.summaries[hash];
                                        //hack to get the kind
                                        var kind = args.kind || summary.kind;
                                        RDR.shareWindow = window.open(RDR_staticUrl+'share.html', 'readr_share','menubar=1,resizable=1,width=626,height=436');
                                        
                                        RDR.actions.share_getLink({
                                            referring_int_id:args.response.data.interaction.id,
                                            hash:args.hash,
                                            kind:kind,
                                            sns:val,
                                            rindow:$rindow,
                                            tag:tag,
                                            content_node:content_node
                                        }); // ugh, lots of weird data nesting
                                        return false;
                                    });
                                });
                                return $shareLinks;
                            }

                            // var $shareSocialWrap = $('.rdr_menu_share .rdr_linkWrap');
                            var $shareSocialWrap = $('.rdr_nextActions');
                            $shareSocialWrap.append( makeShareLinks() );
                        }

                        RDR.actions.containers.media.onEngage( hash );
                    } else {
                        
                        var headerText = RDR.rindow.makeDefaultPanelMessage($rindow);
                        var $header = RDR.rindow.makeHeader( headerText);
                        $rindow.find('.rdr_header').replaceWith($header);

                        $rindow.removeClass('rdr_viewing_more').find('div.rdr_indicator_details_body').show();  // image specific.
                        RDR.rindow.panelHide( $rindow );
                        // RDR.rindow.panelHide( $rindow, 'rdr_view_more', $rindow.data('initialWidth'), null, function() {
                        //     $rindow.find('table.rdr-one-column td').triggerHandler('mousemove');
                        // });
                    }
                    
                    //todo: examine resize
                    RDR.rindow.updateSizes( $rindow );
                }
            },
            jspUpdate: function( $rindow ) {
                //RDR.rindow.jspUpdate:
                //updates or inits first (and should be only) $rindow rdr_body into jScrollPanes

                if ( !$rindow.closest('.jspContainer').length && !$rindow.hasClass('jspScrollable') ) {
                    $rindow.find('div.rdr_body').each( function() {
                        var $this = $(this);

                        if( !$this.hasClass('jspScrollable') ){
                            // IE.  for some reason, THIS fires the scrollend event.  WTF:
                            $(this).jScrollPane({ showArrows:true });
                        }else{
                            var API = $(this).data('jsp');
                            API.reinitialise();
                        }
                    });
                }
            },
            tagBox: {
                setWidth: function( $rindow, width ) {
                    // RDR.rindow.tagBox.setWidth
                    // should probably just be RDR.rindow.setWidth ??
                    // width must be 320, 480, or 640
                    var rindowWidth = (RDR.group.max_rindow_width) ? RDR.group.max_rindow_width:width;
                    $rindow.removeClass('w160 w320 w480 w640').addClass('w'+rindowWidth);
                },
                setHeight: function( $rindow, height ) {
                    // RDR.rindow.tagBox.setHeight
                    // should probably just be RDR.rindow.setWidth ??
                    // width must be 320, 480, or 640
                    $rindow.find('.rdr_body, .jspContainer').height( height );
                },
                make: function( params ) {
                    //RDR.rindow.tagBox.make:
                    var tag = params.tag,
                        boxSize = ( params.boxSize ) ? params.boxSize : "medium", //default
                        $rindow = ( params.$rindow ) ? params.$rindow : null,
                        $tagContainer = ( params.$tagContainer ) ? params.$tagContainer : ( params.$rindow ) ? params.$rindow.find('div.rdr_body.rdr_tags_list') : null,
                        reactionViewStyle = $rindow.attr('rdr-view-style') || 'grid',
                        tagCount = ( tag.tag_count ) ? tag.tag_count:"",
                        tagPercent = 0,
                        tagWidth = '',
                        colorInt = ( params.colorInt ) ? params.colorInt:1,
                        isWriteMode = ( params.isWriteMode ) ? params.isWriteMode:false,
                        kind = $rindow.data('kind'),
                        hash = ($rindow.data('hash')) ? $rindow.data('hash'):$rindow.data('container'),
                        summary = RDR.summaries[hash],
                        totalReactions = (typeof summary != 'undefined')?summary.counts.tags:0,
                        content_node_id = (tag.content_node_id) ? tag.content_node_id:false,
                        content_node = (content_node_id) ? summary.content_nodes[ content_node_id ]:"",
                        message = '';

                        // later, we'll allow rendering percentages on grids/etc, as an option
                    var renderPercentages = (reactionViewStyle=='horizontal_bars') ? true:false;
                    if (renderPercentages===true) {
                        tagPercent = parseInt(tagCount/totalReactions*100);
                        tagWidth = 'width:'+(Math.round(tagCount / summary.counts.highest_tag_count*75 )) + '%';
                    }

                    // if (content_node_id == 'undefined'){
                        // return;
                    // }
                    if ( content_node_id ) {
                        content_node.id = content_node_id;
                    }

                    // NB: a bunch of the following junk is grid-specific, but is sort of ignored in CSS
                    // for ex,

                    // this can go away if we change CSS class names
                    var boxSize = ( boxSize == "big" ) ? "rdr_box_big" : ( boxSize == "medium" ) ? "rdr_box_medium" : "rdr_box_small",
                    // var boxSize = "rdr_box_"+ boxSize, 
                      wideBox = "",
                      writeMode = ( isWriteMode ) ? 'rdr_writeMode' : '',
                      tagBodyRaw = ( tag.body ) ? tag.body:tag.tag_body,
                      tagBodyCrazyHtml = "",
                      tagIsSplitClass = "";

                    
                    if (typeof tagBodyRaw == 'undefined') { return; }
                    
                    // abstract this when we abstract the same thing in the previous function.
                    if ( kind == "page" ) {
                        message = (isWriteMode) ? '+1 '+tagBodyRaw :'';
                    } else if ( tagCount == "" ) {
                        message = '';
                    } else if ( tagCount == -101 ) { // used elsewhere to kludgily indicate that there are no reactions
                        message = '+1 '+tagBodyRaw;
                    } else {
                        // var reactText = ( tagCount == 1 ) ? "reaction":"reactions",
                        //     message = tagCount+' '+reactText+'.  Click to agree.';
                        var message = '+1 '+tagBodyRaw;
                    }
                    
                    var charCountText = ""
                    //split long tag onto two lines.
                    if ( typeof tagBodyRaw != 'undefined' && tagBodyRaw.length < 16 || renderPercentages === true) {
                        charCountText = 'rdr_charCount'+tagBodyRaw.length;
                        tagBodyCrazyHtml = '<div class="rdr_tag_body rdr_tag_lineone">'+tagBodyRaw+'</div>';
                    } else {
                        tagIsSplitClass = "rdr_tag_split";
                        // if no space, hyphenate
                        if ( tagBodyRaw.indexOf(' ') == -1 ) {
                            charCountText = 'rdr_charCount15';
                            tagBodyCrazyHtml = 
                            '<div class="rdr_tag_body rdr_tag_lineone">' + 
                            tagBodyRaw.substr(0,15) + '-<br/>' + tagBodyRaw.substr(15) + '</div>';
                            // if ( boxSize == "rdr_box_small" ) {
                            //     boxSize = "rdr_box_medium";
                            // }
                        } else {
                            var tagBody1 = "", tagBody2 = "", keepLooping = true;
                            tagBodyRawSplit = tagBodyRaw.split(' ');
                            while ( keepLooping ) {
                                tagBody1 += tagBodyRawSplit.shift() + ' ';
                                if ( ( tagBody1.length + tagBodyRawSplit[0].length ) >= 16  ) keepLooping = false;
                            }
                            tagBody2 = tagBodyRawSplit.join(' ');
                            charCountText = 'rdr_charCount'+tagBody1.length;
                            tagBodyCrazyHtml = '<div class="rdr_tag_body rdr_tag_lineone">'+tagBody1+'<br>' + tagBody2 + '</div>';
                        }
                    }

                    var tag_id = tag.id;
                    var parent_id = tag.parent_id;
                    var content_node_str = content_node_id ? 'rdr_content_node_'+content_node_id : "";
                    var tagCount = tagCount || 0;
                    var tagCountDisplay = (renderPercentages===true) ? tagPercent+'%':tagCount;
                    var plusOneCTA = !isWriteMode && ( kind == "page" ) ? 
                        "" : 
                        '<span class="rdr_plusOne">+1</span>';

                    var notWriteModeHtml = isWriteMode ?
                        "" : 
                        '<span class="rdr_count">'+tagCountDisplay+'</span>' +
                        '<i class="rdr_icon-search rdr_tag_read_icon"></i>';

                    var tagBoxHTML = '<div class="rdr_color'+colorInt+' '+boxSize+' rdr_box '+wideBox+' '+writeMode+'" style="'+tagWidth+'">'+
                            '<div '+
                                'class="rdr_tag '+tagIsSplitClass+' '+content_node_str+' '+charCountText+'" '+
                                // 'title="'+message+'" '+
                                'data-tag_id="'+tag_id+'" '+
                                'data-tag_count="'+tagCount+'" '+
                                'data-parent_id="'+parent_id+'" '+
                                'data-content_node_id="'+content_node_id+'" '+
                            '>'+
                                tagBodyCrazyHtml+
                                notWriteModeHtml+
                                plusOneCTA+
                            '</div>'+
                        '</div>';

                    
                    var $tagBox = $(tagBoxHTML);
                    $tagContainer.append( $tagBox );

                    function renderReactedContent( $reactionsTable, tag ) {
                        if ( !$rindow.find('.rdr_view_more').length || !$rindow.find('.rdr_view_more').hasClass('rdr_visiblePanel') ) {
                            var $newPanel = RDR.rindow.panelCreate( $rindow, 'rdr_view_more' );
                            var $rdr_body_wrap = $rindow.find('div.rdr_body_wrap');
                            $rdr_body_wrap.append( $newPanel );

                            $newPanel.append( $reactionsTable ).addClass('rdr_page_reactions_summary');

                            RDR.rindow.tagBox.setWidth( $rindow, 320 );
                            RDR.rindow.panelShow( $rindow, $newPanel, function() {
                                RDR.rindow.hideFooter($rindow);
                                // RDR.rindow.panelEnsureFloatWidths($rindow);
                            });
                        } else {
                            $rindow.find('.rdr_body').html( $reactionsTable );
                            RDR.rindow.jspUpdate( $rindow );
                        }

                        var HeaderTxt = (tag.tag_count <= 0) ? 
                            "no reactions" :
                                (tag.tag_count == 1) ?
                                "1 reaction" :
                                tag.tag_count + " reactions";
                        var $header = RDR.rindow.makeHeader( HeaderTxt );
                            $rindow.find('.rdr_header').replaceWith($header)
                    } // renderReactedContent

                    function _makeBackButton(){
                        var $backButton = $('<div class="rdr_back">Close X</div>');
                        $backButton.on('click.rdr, touchend.rdr', function() {


                            //temp fix because the rindow scrollpane re-init isnt working
                            var isViewForRindow = !!$rindow.attr('rdr-view-reactions-for');
                            if(!isViewForRindow){
                                RDR.rindow.close($rindow);
                                return;
                            }

                        });
                        return $backButton;
                    }

                    function createReactedContentTable($this, counts, pageId) {

                        $().selog('hilite', true, 'off');
                        $('.rdr_twtooltip').remove();
                        var $backButton = _makeBackButton(),
                            $reactionsTable = $('<table cellpadding="0" cellspacing="0" border="0" class="reaction_summary_table"></table>').append('<tbody><tr class="rdr_page_reactions"></tr></tbody>');

                        // add count of page-level reactions
                        if ( counts && counts.page && counts.page > 0 ) {
                            var page_reaction_text =
                                (counts.page == 1 ) ?
                                "1 reaction" :
                                counts.page + " reactions";

                            $reactionsTable.find('.rdr_page_reactions').append('<td colspan="2"><strong>'+page_reaction_text+'</strong> to this <strong>page</strong></td>');
                        }

                        if ( counts.img > 0 || counts.text > 0 || counts.media > 0 ) {
                            // iterate through and create an array of counts + $tr.  this is then sortable.
                            $reactionsTable.find('.rdr_page_reactions').addClass('has_other_reactions');
                            $.each( RDR.interaction_data[ tag.id ], function(int_id, data) {

                                //quick fix for multi page reactions.
                                // todo: #summaryContentByPageFix
                                var hash = data.hash;
                                var summary = RDR.summaries[hash];
                                var $node = $('[rdr-hash="' + hash + '"]');
                                var thisPageId = summary.pageId;

                                if(
                                    !thisPageId || 
                                    !pageId ||
                                    (thisPageId != pageId)
                                ){
                                    return;
                                }

                                if ( !$reactionsTable.find('tr.rdr_int_summary_'+int_id).length ) {
                                    var $tr = $('<tr valign="middle" class="rdr_content_reaction rdr_int_summary_'+int_id+'"/>'),
                                        thing = RDR.interaction_data[ tag.id ][ int_id ];

                                    if (typeof thing.interaction != "undefined" && typeof thing.content_node != "undefined" ) {
                                        var reaction_word = (thing.interaction.count>1) ? "reactions":"reaction";
                                        $tr.append('<td class="rdr_count"><h4>'+thing.interaction.count+'</h4><h5>'+reaction_word+'</h5></td>')//chain
                                        .data('count', thing.interaction.count)//chain
                                        .data('tag', tag)//chain
                                        .data('int_id', int_id);

                                        if ( thing.kind == "text" ) {
                                            $tr.append('<td class="rdr_content">'+thing.content_node.body+'</td>');
                                        } else if ( thing.kind == "img" ) {
                                            $tr.append('<td class="rdr_content"><img src="'+thing.content_node.body+'" height="50"/></td>');
                                        } else if ( thing.kind == "media" ) {
                                            $tr.append('<td class="rdr_content"><img src="'+RDR_baseUrl+'/static/widget/images/video_icon.png" height="33" style="margin-bottom:-10px;"/> <div style="display:inline-block;margin-left:10px;">Video</div></td>');
                                        }

                                        $tr.on('click.rdr, touchend.rdr', function(e) {
                                            e.preventDefault();
                                            var data = {
                                                container_hash:thing.hash,
                                                location:thing.content_node.location
                                            };
                                            RDR.session.revealSharedContent(data);

                                            RDR.events.trackEventToCloud({
                                                event_type: 'sb',
                                                event_value: 'vc',
                                                page_id: thisPageId
                                            });
                                        });

                                        // insert the new content into the right place, ordered by count
                                        if ( !$reactionsTable.find('tr.rdr_content_reaction').length ) {
                                            $reactionsTable.find('tbody').append( $tr );
                                        } else {
                                            var insertIndex = 0;
                                            $.each( $reactionsTable.find('tr.rdr_content_reaction'), function(idx, existing_tr) {
                                                if ( parseInt(thing.interaction.count) > parseInt($(existing_tr).data('count')) ) {
                                                    insertIndex = idx;
                                                    return false;
                                                }
                                            });
                                            $reactionsTable.find('tr.rdr_content_reaction:eq('+insertIndex+')').before( $tr );
                                        }
                                    }
                                }
                            });
                        }
                        return $('<div/>').append( $backButton, $reactionsTable );
                    } // createReactedContentTable

                    // kind-specific click event
                    // porter resume here.  make sure the counts and write element are passed into getReactedContent
                    if ( kind == "page" ) {
                        if ( isWriteMode == false ) {
                            
                            var clickFunc = function(){


                                RDR.rindow.hideFooter($rindow);
                                $rindow.removeClass('rdr_rewritable');

                                var page_id = RDR.util.getPageProperty('id', hash),
                                    page = RDR.pages[ page_id ],
                                    tag_count = tag.tag_count,
                                    counts = {
                                        "img":0,
                                        "text":0,
                                        "media":0,
                                        "page":(tag_count=="+")?0:tag_count
                                    };
                                

                                RDR.events.trackEventToCloud({
                                    event_type: 'sb',
                                    event_value: 'vr',
                                    page_id: page_id
                                });


                                $.each( page.containers, function( idx, container ) {
                                    if ( RDR.summaries && RDR.summaries[container.hash] && RDR.summaries[container.hash].top_interactions ) {
                                        if ( RDR.summaries[container.hash].top_interactions.tags && RDR.summaries[container.hash].top_interactions.tags[tag.id] ) {
                                            counts[RDR.summaries[container.hash].kind] += RDR.summaries[container.hash].top_interactions.tags[tag.id].count;
                                            counts.page -= RDR.summaries[container.hash].top_interactions.tags[tag.id].count;
                                        }
                                    }
                                });

                                var $this = $(this),
                                    $reactionsTable = createReactedContentTable($this, counts, page.id);

                                renderReactedContent( $reactionsTable, tag );

                                $this.addClass('rdr_live_hover');
                            };

                            $tagBox.on('click.rdr, touchend.rdr', function(){
                                clickFunc();
                            });


                        } else {
                            $tagBox.on('click.rdr, touchend.rdr', function() {
                                $(this).addClass('rdr_tagged');
                                $rindow.removeClass('rdr_rewritable');
                                var hash = $rindow.data('container');
                                args = { tag:tag, hash:hash, uiMode:'writeMode', kind:$rindow.data('kind'), rindow:$rindow, content_node:content_node};
                                RDR.actions.interactions.ajax( args, 'react', 'create');
                            });
                        }
                    } else {
                        if(isTouchBrowser){
                            // mobiletodo.  simulate hover and a css class.
                            // check for class, and if present, simulate click
                            $tagBox.bind('tap', function() {
                                $(this).addClass('rdr_tagged');
                                $rindow.removeClass('rdr_rewritable');
                                var hash = $rindow.data('container');
                                args = { tag:tag, hash:hash, uiMode:'writeMode', kind:$rindow.data('kind'), rindow:$rindow, content_node:content_node};
                                RDR.actions.interactions.ajax( args, 'react', 'create');
                            });
                        }else{
                            $tagBox.click( function() {
                                $(this).addClass('rdr_tagged');
                                $rindow.removeClass('rdr_rewritable');
                                var hash = $rindow.data('container');
                                args = { tag:tag, hash:hash, uiMode:'writeMode', kind:$rindow.data('kind'), rindow:$rindow, content_node:content_node};
                                RDR.actions.interactions.ajax( args, 'react', 'create');
                            });
                        }
                    }

                    // global (all kinds) hover event
                    if(!isTouchBrowser){
                        $tagBox.hover(function() {
                            var $this = $(this);
                            if ( !$this.hasClass('rdr_tagged') ) {
                                var $tagCount = $this.find('span.rdr_tag_count');
                                $tagCount.width( $tagCount.width() );
                                $tagCount.text('+');
                            }
                        }, function() {
                            var $this = $(this);
                            $this.find('span.rdr_tag_count').text( $this.find('.rdr_tag').data('tag_count') );
                        });
                    }

                    // $container.append( $tagBox, " " );
                    
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

                    if ( !$.isEmptyObject( comments ) && !isWriteMode ) {
                        var $commentHover = $('<span class="rdr_comment_hover rdr_tooltip_this" title="view comments"></span>');

                        $commentHover.append( '<i class="rdr_icon-comment"></i> '+num_comments );
                        
                        if(isTouchBrowser){
                            $commentHover.bind('tap', function() {
                                // replacewith bug
                                $(this).tooltip('hide');
                                RDR.actions.viewCommentContent({
                                    tag:tag,
                                    hash:hash,
                                    rindow:$rindow,
                                    content_node:content_node,
                                    selState:content_node.selState
                                });
                                return false;
                            });
                        }else{
                            $commentHover.click( function() {
                                // replacewith bug
                                $(this).tooltip('hide');
                                RDR.actions.viewCommentContent({
                                    tag:tag,
                                    hash:hash,
                                    rindow:$rindow,
                                    content_node:content_node,
                                    selState:content_node.selState
                                });
                                return false;
                            });
                        }

                        $tagBox.append( $commentHover );
                        $commentHover.tooltip();
                    }

                    return $tagBox;
                }
            },
            writeCustomTag: function( $container, $rindow, actionType ) {
                //RDR.rindow.writeCustomTag
                // think we don't need $container or actionType

                var $container = $rindow.find('.rdr_footer');
                $container.append( '<div class="rdr_box"></div> ');

                if ( $container.find('div.rdr_custom_tag').not('div.rdr_custom_tag.rdr_tagged').length == 0) {
                    var actionType = ( actionType ) ? actionType : "react",
                        helpText =  ( actionType=="react" ) ? "+ Add your own" : "+ Add tag...";

                    // add custom tag
                    var $clickOverlay = $('<div class="rdr_click_overlay"></div>').appendTo($container);
                    var $custom = $('<div class="rdr_tag rdr_custom_tag"></div>');
                    var $customInput = $('<input value="'+helpText+'" />').appendTo($custom);
                    var $customSubmit = $('<button class="rdr_custom_tag_submit" name="rdr_custom_tag_submit">ok</button>').appendTo($custom);
                    $customSubmit.click(function(){
                        submitCustomTag($custom, $customInput);
                    });
                    
                    $clickOverlay.click(function(){
                        $customInput.focus();
                    });
                                        
                    $customInput.focus( function() {
                        // RDR.events.track('start_custom_reaction_rindow');
                        var $input = $(this);
                        $input.removeClass('rdr_default');
                        if ( $input.val() == helpText ) {
                            $input.val('');
                        }

                        $clickOverlay.hide();
                        $customSubmit.show();

                    }).blur( function() {
                        var $input = $(this);
                        if ( $input.val() === "" ) {
                            $input.val( helpText );
                            $customSubmit.hide();
                            $clickOverlay.show();
                        }
                        if ( $input.val() == helpText ) {
                            $input.addClass('rdr_default');
                            $customSubmit.hide();
                            $clickOverlay.show();              
                        }
                        $input.closest('div.rdr_tag').removeClass('rdr_hover');
                        
                    }).keyup( function(event) {
                        var $input = $customInput;
                        if (event.keyCode == '13') { //enter.  removed comma...  || event.keyCode == '188'
                            submitCustomTag($custom, $customInput);
                        }
                        else if (event.keyCode == '27') { //esc
                            $input.blur();
                            // return false so the rindow doesn't close.
                            return false;
                        } else if ( $input.val().length > 25 ) {
                            var customTag = $input.val();
                            $input.val( customTag.substr(0, 25) );
                        }
                    });

                    $container.find('.rdr_box').append( $custom, " " );

                    function submitCustomTag($custom, $customInput){
                        var tag = {},
                            hash = $rindow.data('container');
                            //note that hash is a $(dom) element, not a hash.  Fix this later.
                        
                        var val = $customInput.val();
                        if(val === ""){
                            return;
                        }
                        tag.body = val;

                        $custom.parent().addClass('rdr_tagged');

                        // args = { tag:tag, hash:hash, kind:"page" };
                        args = { tag:tag, hash:hash, uiMode:'writeMode', kind:$rindow.data('kind'), rindow:$rindow};
                        RDR.actions.interactions.ajax( args, actionType, 'create' );
                        $customInput.blur();
                        // $custom.tooltip();
                    }

                    $(document).on('keydown.rdr', function(event) {
                        // this won't be international-friendly -- it's a list of letters, numbers, punctuation, plus SHIFT
                        keyCodes = [16, 81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 65, 83, 68, 70, 71, 72, 74, 75, 76, 90, 88, 67, 86, 66, 78, 77, 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 189, 187, 219, 221, 220, 186, 222, 188, 190, 191, 192];
                        if ( $.inArray(event.keyCode, keyCodes) != -1 ) {
                            $container.find('input').focus();
                        }
                    });
                }
            },
            _rindowTypes: {
                //RDR.rindow._rindowTypes:
                tagMode: {
                    //RDR.rindow._rindowTypes.tagMode.make(settings);
                    // [porter] we should change the name of this function.  no need to nest under _rindowTypes anymore, right?
                    make: function(settings){
                        //RDR.rindow._rindowTypes.writeMode.make:
                        //as the underscore suggests, this should not be called directly.  Instead, use RDR.rindow.make(rindowType [,options])

                        if ( settings.is_page == true ) {
                            var page = settings.page,
                                $summary_widget = $('.rdr-summary-'+page.id),
                                coords = {
                                    top: $summary_widget.offset().top,
                                    left: $summary_widget.offset().left
                                };

                            // don't redraw summary rindow if already showing
                            if ( $('div.rdr_page_key_' + $summary_widget.data('page_key') ).length ) {
                                return;
                            }

                            var $rindow = RDR.rindow.draw({
                                    coords: coords,
                                    container: $summary_widget,
                                    content: 'page',
                                    kind: 'page',
                                    mode:settings.mode
                                });

                        } else {
                            var hash = settings.hash;
                            var page_id = RDR.util.getPageProperty('id', hash );

                            var summary = RDR.summaries[hash],
                                $container = summary.$container,
                                kind = summary.kind,
                                rewritable = (settings.rewritable == false) ? false:true,
                                coords = {};

                            var actionType = (settings.actionType) ? settings.actionType:"react";

                            /* START create rindow based on write vs. read mode */
                            if ( settings.mode == "writeMode" ) {
                                // show writemode text
                                // writeMode
                                

                                // RDR.events.track('start_react_text');
                                RDR.events.trackEventToCloud({
                                    // category: "engage",
                                    // action: "rindow_shown_writemode",
                                    event_type: 'rs',
                                    event_value: 'wr',
                                    // opt_label: "kind: text, hash: " + hash,
                                    container_hash: hash,
                                    container_kind: kind,
                                    page_id: page_id
                                });


                                var newSel;
                                if ( kind == "text" ) {
                                    
                                    //Trigger the smart text selection and highlight
                                    newSel = $container.selog('helpers', 'smartHilite');
                                    if(!newSel) return false;
                                    //temp fix to set the content (the text) of the selection to the new selection
                                    //todo: make selog more integrated with the rest of the code
                                    settings.content = newSel.text;
                                    coords.left = coords.left + 40;
                                    coords.top = coords.top + 35;
                                    //if sel exists, reset the offset coords
                                    if(newSel){
                                        //todo - combine with copy of this
                                        var hiliter = newSel.hiliter,
                                        $hiliteEnd = hiliter.get$end();

                                        //testing adjusting the position with overrides from the hilite span
                                        if( $hiliteEnd ){
                                            var $helper = $('<span />');
                                            $helper.insertAfter( $hiliteEnd );
                                            var strRight = $helper.offset().right;
                                            var strBottom = $helper.offset().bottom;
                                            $helper.remove();
                                            coords.left = strRight - 14; //with a little padding
                                            coords.top = strBottom + 23;
                                        }
                                    }

                                    // override the coordinates.  the selection-based stuff fails on iPhone after you scroll down.
                                    if (isTouchBrowser) {
                                        var $container = $('[rdr-hash="'+hash+'"]');
                                        var coords = {
                                            top: $container.offset().bottom+5,
                                            left: $container.offset().left
                                        };
                                    }
                                } else {
                                    // draw the window over the actionbar
                                    // need to do media border hilites
                                    var topValue = ( !$container.parents( RDR.group.img_container_selectors ).length ) ? $container.offset().bottom - 5 : $container.parents( RDR.group.img_container_selectors ).first().offset().bottom + 5;
                                    var coords = {
                                        top: topValue,
                                        left: $container.offset().left
                                    };
                                }
                            } else {
                                // readMode
                                // show readmode 
                                var selector = '[rdr-hash="' + hash + '"]';

                                var $indicator = $('#rdr_indicator_'+hash),
                                $indicator_body = $('#rdr_indicator_body_'+ hash),
                                $container = $('[rdr-hash="'+hash+'"]');

                                if ( kind == "text" ) {
                                    coords = {
                                        top: $indicator_body.offset().top + 22,
                                        left: $indicator_body.offset().left -5
                                    };
                                } else {
                                    var coords = {
                                        top: $container.offset().bottom+5,
                                        left: $container.offset().left
                                    };

                                    //log media readmode
                                    // RDR.events.track( 'view_node::'+hash, hash );
                                    RDR.events.trackEventToCloud({
                                        // category: "engage",
                                        // action: "rindow_shown_readmode",
                                        // opt_label: "kind: "+kind+", hash: " + hash,
                                        event_type: 'rs',
                                        event_value: 'rd',
                                        container_hash: hash,
                                        container_kind: kind,
                                        page_id: page_id
                                    });

                                }

                                // $indicatorDetails.hide();
                            }

                            // if there is a custom CTA element, override the coordinates with its location
                            if ( typeof settings.$custom_cta != "undefined" ) {
                                if (isTouchBrowser) {
                                    var coords = {
                                        top: settings.$custom_cta.offset().bottom+5,
                                        left: settings.$custom_cta.left
                                    };
                                } else {
                                    var rdr_offset_x = (settings.$custom_cta.attr('rdr-offset-x')) ? parseInt(settings.$custom_cta.attr('rdr-offset-x')) : 0;
                                    var rdr_offset_y = (settings.$custom_cta.attr('rdr-offset-y')) ? parseInt(settings.$custom_cta.attr('rdr-offset-y')) : 0;
                                    coords.top = settings.$custom_cta.offset().top + rdr_offset_y;
                                    coords.left = settings.$custom_cta.offset().left + rdr_offset_x;
                                }

                            }

                            var $rindow = RDR.rindow.draw({
                                coords: coords,
                                container: hash,
                                content: settings.content,
                                kind: kind,
                                selState: newSel,
                                rewritable:rewritable,
                                mode:settings.mode
                            });
                            //later we should consolodate the use of 'container' and 'hash' as the key
                            $rindow.data('hash', hash);
                            summary['$rindow_'+settings.mode.toLowerCase()] = $rindow;
                        }

                        /* END create rindow based on write vs. read mode */

                        $rindow.addClass('rdr_'+settings.mode.toLowerCase());

                        /* START populate the header */
                        var headerText = RDR.rindow.makeDefaultPanelMessage($rindow);

                        var $header = RDR.rindow.makeHeader( headerText );
                        $rindow.find('.rdr_header').replaceWith($header);

                        /* START create the tag boxes.  read / write mode matters. (??) */
                        $rindow.addClass('rdr_reactions');

                        var $bodyWrap = $rindow.find('div.rdr_body_wrap');

                        var $oldTagList = $rindow.find('div.rdr_body');
                        if($oldTagList.length){
                            $oldTagList.remove();
                        }

                        // write inline tags: initial rindow instantiation
                        if ( settings.is_page == true ) {
                            var $tagList = RDR.actions.indicators.utils.makeTagsListForInline( $rindow, settings.mode == "writeMode", page ); // it's usually/always? readMode, so the second arg there wil be false
                        } else {
                            var $tagList = RDR.actions.indicators.utils.makeTagsListForInline( $rindow, settings.mode == "writeMode" );
                        }
                        $bodyWrap.append($tagList);
                        /* END create the tag boxes.  read / write mode matters. */

                        /* START modify the rindow size */
                        var contentWidth = $bodyWrap.width(),
                            contentHeight = $bodyWrap.height();
           
                        var newCoords = RDR.util.stayInWindow({coords:coords, width:contentWidth, ignoreWindowEdges:settings.ignoreWindowEdges});

                        $rindow.css('left', newCoords.left + 'px').css('top', newCoords.top + 'px');

                        $rindow.animate({
                            width:contentWidth
                        }, 333, 'swing' );

                        $rindow.data( 'initialWidth', contentWidth ).data('initialHeight', contentHeight );


                        //todo
                        $rindow.find('div.rdr_cell_wrapper div.rdr_tag').css({'width':'100%'});
                        // $rindow.find('div.rdr_custom_tag input').focus();

                        // return $rindow to RDR.rindow.make
                        return $rindow;

                        /* END modify the rindow size */
                    },
                    customOptions: {

                    },
                    setup: function(){

                    }
                }
            },
            make: function(rindowType, options){
                //RDR.rindow.make:
                //temp tie-over
                var hash = options.hash,
                    summary = RDR.summaries[hash],
                    kind = options.kind,
                    isPage = options.is_page;

                if (!isPage && !summary) {
                    // setup the summary
                    // FORCING SUMMARY CREATION
                    var summary = RDR.util.makeEmptySummary(hash);
                    RDR.actions.containers.setup(summary);
                }
                // summary = RDR.summaries[hash];

                //checks for rindowType
                if ( !rindowType ) rindowType = "readMode";
                // if ( !RDR.rindow._rindowTypes.hasOwnProperty(rindowType) ) return;
                //else

                var defaultOptions = RDR.rindow.defaults,
                    customOptions = RDR.rindow._rindowTypes.customOptions,
                    settings = $.extend( {}, defaultOptions, customOptions, options, {mode:rindowType} );
                //call make function for appropriate type

                var $rindow = RDR.rindow._rindowTypes.tagMode.make(settings);
                
                // return $rindow to whatever called RDR.rindow.make
                return $rindow;

            },
            draw: function(options) {
                //RDR.rindow.draw:

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
                    id: "rdr_loginPanel",
                    pnls:1,
                    height:225,
                    animTime:100,
                    maxHeight: 350
                }
                */

                //at least for now, always close all other rindows.
                RDR.rindow.closeAll();

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
                    rdr_for = ( typeof settings.container == "string" ) ? 'rdr_for_'+settings.container:'rdr_for_page',
                    $new_rindow = $('<div class="rdr rdr_window rdr_rewritable rdr_widget w160 '+rdr_for+'"></div>');

                if ( settings.id ) {
                    $('#'+settings.id).remove(); 
                    // todo not sure we should always just REMOVE a pre-existing rindow with a particular ID...
                    // reason I'm adding this: want a login panel with an ID and data attached to it, so after a user
                    // logs in, the login rindow knows what function to then call
                    $new_rindow.attr('id',settings.id);
                }

                //this is instead of the if / else below
                $('#rdr_sandbox').append( $new_rindow );
                
                if ( settings.kind == "page" ) {
                    $new_rindow.addClass('rdr_page_key_' + options.container.data('page_key') ).addClass('rdr_page_summary');
                }

                $new_rindow.data(settings);
                
                if ( $new_rindow.find('div.rdr_header').length === 0 ) {  // not sure why this conditional is here.  [pb] b/c just above, it's possible a rindow exists and we want to use that.
                    $new_rindow.html('');
                    $new_rindow.append(
                        '<div class="rdr rdr_header">'+
                            '<div class="rdr_header_arrow"><img src="'+RDR_staticUrl+'widget/images/header_up_arrow.png" /></div>'+
                            '<div class="rdr_loader"></div>'+
                            '<div class="rdr_about"><a href="http://www.readrboard.com/" target="_blank">&nbsp;</a></div>'+
                        '</div>'+
                        '<div class="rdr rdr_body_wrap rdr_clearfix"></div>'+
                        '<div class="rdr rdr_footer"></div>'
                    );

                    if ( settings.noHeader ) $new_rindow.find('div.rdr_header').remove();  // haha.  let's manipulate the DOM twice.  (Add then remove.)

                    // $new_rindow.draggable({
                    //     handle:'.rdr_header', //todo: move the header_overlay inside the header so we don't need this hack
                    //     containment:'document',
                    //     stack:'.rdr_window',
                    //     start:function() {
                    //         $(this).removeClass('rdr_rewritable');
                    //     }
                    // });
                    $new_rindow.drags({
                        handle:'.rdr_header' //todo: move the header_overlay inside the header so we don't need this hack
                        // containment:'document',
                        // stack:'.rdr_window',
                        // start:function() {
                            // $(this).removeClass('rdr_rewritable');
                        // }
                    });
                }

                var coords = settings.coords;

                $new_rindow.css('left', coords.left + 'px');
                $new_rindow.css('top', coords.top + 'px');
                if(settings.height){
                    $new_rindow.height(settings.height);
                }
                // do we need to call this twice in this function?
                RDR.actionbar.closeAll();

                $new_rindow.settings = settings;

                $new_rindow.on( "resizestop", function(event, ui) {
                    var $this = $(this);
                    
                    //todo: examine resize
                    // RDR.rindow.updateSizes( $this );
                });

                return $new_rindow;
            },
            safeClose: function( $rindow ) {
              //RDR.rindow.safeClose:

              var isView = !!$rindow.attr('rdr-view-reactions-for');

              if(isView){

                var $header = RDR.rindow.makeHeader( 'Reactions' );
                    $rindow.find('.rdr_header').replaceWith($header);
                    RDR.rindow.updateFooter( $rindow );

                    var $panelWrap = $rindow.find('.rdr_body_wrap'),
                        $currentlyVisiblePanel = $panelWrap.find('.rdr_visiblePanel'),
                        $currentlyHiddenPanel = $panelWrap.find('.rdr_hiddenPanel');
                    
                    $panelWrap.animate({
                        left: 0
                    });

                    $currentlyVisiblePanel.removeClass('rdr_visiblePanel').addClass('rdr_hiddenPanel');
                    $currentlyHiddenPanel.removeClass('rdr_hiddenPanel').addClass('rdr_visiblePanel');

                    // if ( $rindow.data('initialWidth') >= 480 ) {
                    //     RDR.rindow.tagBox.setWidth( $rindow, 480 );
                    //     RDR.rindow.updateSizes( $rindow, { setHeight:$rindow.find('.rdr_tags_list').height() + 70 } );
                    // } else {
                    //     if ( $rindow.data('initialWidth') == 160 ) { RDR.rindow.tagBox.setWidth( $rindow, 160 ); }
                    //     RDR.rindow.updateSizes( $rindow, { setHeight:$rindow.find('.rdr_tags_list').height() + 95 } );
                    // }

                return true;
              }

              RDR.rindow.close($rindow);
              return true;
            },
            close: function( $rindows ) {
                //RDR.rindow.close:
                RDR.rindow.clearHilites( $rindows );
                $rindows.each(function(idx,rindow){
                    $(rindow).remove();
                });

                //todo: move this - this is a temp shotgun spray approach.
                //toggled to hidden in RDR.rindow._rindowTypes.readMode.make:
                $('#rdr_indicator_details_wrapper').find('.rdr_body_wrap').css({
                   'visibility':'visible'
                });
            },
            closeAll: function() {
                var $allRindows = $('div.rdr.rdr_window').not('.rdr_no_clear');
                RDR.rindow.close( $allRindows );
                $('.rdr_shared').removeClass('rdr_shared');
                $(document).unbind('keydown.rdr'); // remove the "start typing to immediately add a custom tag" feature
            },
            clearHilites: function( $rindows ){
                var selStates = [];
                $rindows.each(function(idx,rindow){
                    var hash = $(rindow).data('container');

                    //if not a rindow for a container, there won't be any hilites.
                    if ( typeof hash === 'undefined' ) return;
                    //else

                    var summary = RDR.summaries[hash];

                    //todo: think about better name and pattern for how write-mode hilite gets stored.
                    //first find writeMode selState
                    var selState = $(rindow).data('selState');
                    if ( typeof selState !== 'undefined' && selState !== ""){
                        //note that image rindows have no hilite, but this takes care of that.
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
                //RDR.rindow.update:
                var summary = RDR.summaries[hash],
                    $rindow_readmode = summary.$rindow_readmode,
                    $rindow_writemode = summary.$rindow_writemode;

                if( diffNode){
                    if( diffNode.int_type == "coms" ){
                        if($rindow_writemode && $rindow_writemode.length){

                            //add the content_id class to the tags
                            $tags = $rindow_writemode.find('.rdr_tags').find('.rdr_tag');
                            $tags.addClass('rdr_content_node_'+diffNode.content_id);

                            _addComIndicator($rindow_writemode, diffNode);
                        }
                        if($rindow_readmode && $rindow_readmode.length){
                            _addComIndicator($rindow_readmode, diffNode);
                        }else{
                            //image container.
                            var $rindow = $('#rdr_indicator_details_'+hash);

                            //add the content_id class to the tags
                            $tags = $rindow.find('.rdr_tags').find('.rdr_tag');
                            $tags.addClass('rdr_content_node_'+diffNode.content_id);

                            _addComIndicator($rindow, diffNode);
                        }
                    }
                }else{
                    //yuck - improve this later
                    //right now this is just being used as a call to 'init' the rindow state for media
                    var isMedia = ( summary.kind && ( summary.kind == "img" || summary.kind == "media" || summary.kind == "med") );
                    if(!isMedia){
                        return;
                    }
                    RDR.actions.indicators.utils.makeDetailsContent(hash);
                }

                function _addComIndicator($rindow, diffNode){
                    var $tags, $tag;
                    $tags = $rindow.find('.rdr_tags');

                    //todo: we also need the contentnode id to make this unique
                    //The class looks like this: rdr_tag rdr_tag_368 rdr_content_node_518
                    $tag = $tags
                        .find('.rdr_tag_'+diffNode.parent_interaction_node.id)
                        .filter(function(){
                            return $(this).hasClass('rdr_content_node_'+diffNode.content_id);
                        });

                    $tag.addClass('rdr_comment_indicator');
                    _tempCopyOfCommentHover(diffNode, $tag, $rindow);
                    _tempMakeRindowResizeIfOneColumnWhenAddingFirstComment( $rindow ); // deprecated?
                    _addLinkToViewComs(diffNode, $tag, $rindow);


                }

                function _tempMakeRindowResizeIfOneColumnWhenAddingFirstComment($rindow) {
                    // deprecated?
                    var $tag_table = $rindow.find('table.rdr_tags')

                    // this is a duplication of code from elsewhere:
                    if ( $tag_table.find('tr:eq(0)').find('td').length == 1 ) {
                        $tag_table.addClass('rdr-one-column');

                        if(!isTouchBrowser){
                            $tag_table.find('td.rdr_has_pillHover').on('mouseenter, mousemove', function() {
                                var $this = $(this),
                                    $rindow = $this.closest('div.rdr_window');

                                thisWidth = $rindow.data('initialWidth');
                            }).on('mouseleave', function() {
                                var $this = $(this),
                                    $rindow = $this.closest('div.rdr_window');
                                thisWidth = $rindow.width();
                            });
                        }
                    }
                }

                function _tempCopyOfCommentHover(diffNode, $tag, $rindow){

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
                        RDR.safeThrow(err);
                        
                        //this didn't fix the problem anyway - leave it out.
                        //try to recover
                        // try{
                        //     var comsPerContentNodeId = RDR.content_nodes[hash]['undefined'].top_interactions.coms;
                        // }
                        // catch(e){
                        //     RDR.safeThrow(e);
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
                    $a.find('.rdr_comment_hover').remove();
                    $a.find('.rdr_comment_indicator').remove();

                    var $commentHover = $('<span class="rdr_comment_hover"/>');


                    $commentHover.append( '<span class="rdr_icon"></span> '+num_comments );
                    $commentHover.click( function() {

                        RDR.actions.viewCommentContent({
                            tag:tag,
                            hash:hash,
                            rindow:$rindow,
                            content_node:content_node,
                            selState:content_node.selState
                        });
                    });

                    $a.append( $commentHover );
                    $a.closest('td').addClass('rdr_has_pillHover'); // deprecated?

                }
                function _addLinkToViewComs(diffNode, $tag, $rindow){
                    var tag = diffNode.parent_interaction_node;
                    var content_node = diffNode.content_node;
                    
                    var $linkToComment = $('<span class="rdr_comment_feedback"/>');

                    $linkToComment.append( '<span class="linkToComment">Thanks for your comment! <a href="javascript:void(0);">Close</a></span> ');
                    


                    //this broke - for now, just use the quick fix below
                    // $linkToComment.click( function() {
                    //     var selState = content_node.selState || $rindow.data('selState');
                    //     RDR.actions.viewCommentContent({
                    //         tag:tag,
                    //         hash:hash,
                    //         rindow:$rindow,
                    //         content_node:content_node,
                    //         selState:selState
                    //     });
                    //     return false;
                    // });

                    //silly quick way to just trigger the back button
                    $linkToComment.click( function(e) {
                        e.preventDefault();
                        //there's a bug, just close the rindow for now. 
                        RDR.rindow.safeClose( $rindow );
                        // $rindow.find('.rdr_back').eq(0).click();
                    });

                    $rindow.find('div.rdr_commentBox')
                        .empty()
                        .append($linkToComment)
                        .show();

                    $rindow.find('button.rdr_add_comment').hide();

                }


            }//end RDR.rindow.update
        },
        actionbar: {
            draw: function(settings) {
                //RDR.actionbar.draw:
                //expand to make settings explicit

                //node: summary may not be defined at this point, so get info from settings.
                var hash = settings.hash,
                    coords = settings.coords,
                    kind = settings.kind,
                    content = settings.content,
                    src_with_path = settings.src_with_path || undefined, //used for media only
                    page_id = RDR.util.getPageProperty('id', hash );

                var actionbar_id = "rdr_actionbar_"+hash;
                var $actionbars = $('div.rdr_actionbar');

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
                        top: coords.top + 8,  // text actionbar offset.  used to be -33.  tried moving down per CM's feedback at FastCo
                        left: coords.left + 3
                    }
                };

                coords = (kind == 'text') ? actionbarOffsets.text : actionbarOffsets.img(coords);

                //todo: for images and video, put the actionbar on the left side if the image is too far right
                if (kind == 'text') {
                    //rewrite coords if needed
                    coords = RDR.util.stayInWindow({coords:coords, width:45, height:30, paddingY:40, paddingX:40, ignoreWindowEdges:settings.ignoreWindowEdges});
                }

                // TODO use settings check for certain features and content types to determine which of these to disable
                var $new_actionbar = $('<div class="rdr rdr_actionbar rdr_widget rdr_widget_bar" id="' + actionbar_id + '" ></div>');
                $new_actionbar.css({
                   'top':coords.top,
                   'left':coords.left
                });

                //if there is no hash here it will cause problems.  Should always be a hash.
                if(!hash){
                    RDR.safeThrow('There should always be a hash from hashNodes after hover on an unhashed image.');
                    return;
                }
                $new_actionbar.data('hash',hash);
                
                $new_actionbar.append('<ul/>');

                var items = [
                    {
                        "item":"reaction",
                        "tipText":"What do you think?",
                        "onclick":function(){
                            RDR.rindow.make( 'writeMode', {
                                "hash": hash,
                                "kind": kind,
                                "content": content,
                                "src_with_path":src_with_path
                            });
                        }
                    }//,
                    /*
                    {
                        "item":"bookmark",
                        "tipText":"Remember this",
                        "onclick":function(){
                            RDR.rindow.make( 'writeMode', {
                                "hash": hash,
                                "kind": kind,
                                "content": content,
                                "src_with_path":src_with_path,
                                "actionType":"bookmark"
                            });
                        }
                    }
                    */
                ];
                // RDR.events.track( 'show_action_bar::'+content );

                // not sure this is valuable and it adds network chatter
                // RDR.events.trackEventToCloud({
                //     // category: "actonbar",
                //     // action: "actionbar_shown",
                //     // opt_label: "kind: "+kind+", hash: "+hash+", content: "+content,
                //     event_type: 'actionbar',
                //     event_value: 'show',
                //     container_hash: hash,
                //     container_kind: kind,
                //     page_id: page_id
                // });
                $.each( items, function(idx, val){
                    var $item = $('<li class="rdr_icon_' +val.item+ '" />'),
                    $indicatorAnchor = $(
                        '<a href="javascript:void(0);" class="rdr_tooltip_this" title="'+val.tipText+'">'+
                            '<span class="rdr rdr_react_icon">'+val.item+'</span>'+
                            '<span class="rdr rdr_react_label">What do you think?</span>'+
                            '<div class="rdr_clear"></div>'+
                        '</a>'
                    );
                    
                    $indicatorAnchor.click(function(){
                        val.onclick();
                        return false;
                    });
                    $item.addClass('rdr_actionbar_first').append( $indicatorAnchor ).appendTo($new_actionbar.children('ul'));
                });
                $('#rdr_sandbox').append( $new_actionbar );
                // $('a.rdr_tooltip_this').tooltip({});

                if(kind == "img" || kind == "media" || kind == "med" ){
                    $new_actionbar.addClass('rdr_actionbar_for_media');
                    $new_actionbar.append('<div style="clear:both;" />').removeClass('rdr_widget rdr_widget_bar');

                    //for now, just move the actionbar here overridding the positioning from above:
                }


                function _getMediaCoords(coords){
                    /*
                    var newCoords = {
                        top: coords.top - 2,
                        left: coords.left + 2
                    };
                    */
                    var $containerTracker = $('#rdr_container_tracker_'+hash),
                        $topHilite = $containerTracker.find('.rdr_mediaHilite_top');

                    var newCoords = {
                        top: $topHilite.offset().top,
                        left: $topHilite.offset().right
                    };
                    return newCoords;
                }

                return $new_actionbar;

            },
            close: function($actionbars, effect){
                //RDR.actionbar.close:
                $actionbars.each(function(){
                    var $actionbar = $(this),
                        hash = $actionbar.data('hash'),
                        $containerTracker = $('#rdr_container_tracker_'+hash);

                    if(typeof effect !== "undefined"){ //quick hack to signal fade effect
                        //make more robust if we want more animations
                        //I wanted to combine these into one animation, but jquery didn't like that.
                        $actionbar.fadeOut(200);
                    }
                    else{
                        cleanup($actionbar, hash);

                        var $indicator = $('#rdr_indicator_'+hash);
                    }
                });

                //helper function
                function cleanup($actionbar, hash){
                    var timeoutCloseEvt = $actionbar.data('timeoutCloseEvt');
                    var timeoutCollapseEvt = $actionbar.data('timeoutCollapseEvt');
                    clearTimeout(timeoutCloseEvt);
                    clearTimeout(timeoutCollapseEvt);

                    var $container = $('[rdr-hash="'+hash+'"]'),
                        $indicator = $('#rdr_indicator_'+hash);

                    $container.removeClass('rdr_engage_media');
                    $actionbar.remove();
                }

            },
            closeSuggest: function(hashes) {
                //hashes can be a single hash or a list of hashes
                var $actionbars = $();
                if( !hashes ){
                    $actionbars = $('div.rdr_actionbar');
                }
                else
                if(typeof hashes == "string" ){
                    var hash = hashes;
                    $actionbars = $('#rdr_actionbar_'+hash);
                    $actionbars.data('hash',hash);
                }
                else{
                    $.each( hashes, function(idx, hash){
                        $actionbars = $actionbars.add('#rdr_actionbar_'+hash);
                        $actionbars.data('hash',hash);
                    });
                }

                var scope = this;
                $actionbars.each(function(){
                    var $this = $(this),
                    hash = $actionbars.data('hash'),
                    $indicator_details = $('#rdr_indicator_details_'+hash),
                    $containerImg = $('[rdr-hash="'+hash+'"]'),
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
                var $actionbars = $('div.rdr_actionbar');
                this.close($actionbars);
            }
        },
        util: {
            bubblingEvents: {
                'touchend': false,
                'dragging': false
            },
            windowBlur: function() { /*RDR.util.clearWindowInterval();*/ return; },
            windowFocus: function() { return; },
            clearWindowInterval: function () {
                // clearInterval($.data(this, 'rdr_intervalTimer'));
            },
            setWindowInterval: function () {
                $.data(this, 'rdr_intervalTimer', setInterval(function() {
                    if (typeof RDR.events != 'undefined') { RDR.events.checkTime(); }
                }, 1000));
            },
            checkForSelectedTextAndLaunchRindow: function(){
                //RDR.util.checkForSelectedTextAndLaunchRindow
                    
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

                var $actionbar = RDR.actions.startSelect($node, null, function(hash, kind, content){

                    RDR.rindow.make( 'writeMode', {
                        "hash": hash,
                        "kind": kind,
                        "content": content
                    });
                });
            },
            initTouchBrowserSettings: function(){
                // RDR.util.initTouchBrowserSettings
                
                if(isTouchBrowser){
                    $('body').addClass('rdr_touch_browser');
                    // mobiletodo: DO WE NEED
                    $(window).on('scrollend', function() {
                        RDR.util.mobileHelperToggle();
                    });
                }

                $RDR.dequeue('initAjax');
            },
            mobileHelperToggle: function() {
                // RDR.util.mobileHelperToggle
                $(RDR.group.active_sections).find('embed[rdr-node], video[rdr-node], object[rdr-node], iframe[rdr-node], img[rdr-node]').each( function() {

                    var $this = $(this),
                        hash = $this.data('hash');

                    RDR.actions.indicators.init(hash);
                    $this.addClass('rdr_live_hover');
                });

                
            },
            initPublicEvents: function(){
                // RDR.util.initPublicEvents
                //setup a space to bind and trigger events
                //we're using the rdr_sandbox which is somewhat arbitrary, but it will work fine and keep things clean.
                window.readrboard.public_events = $('#rdr_sandbox');
                $RDR.dequeue('initAjax');
            },
            makeEmptySummary : function(hash, kind) {
            // RDR.util.makeEmptySummary( hash )
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
            //RDR.util.getPageProperty

            // goal is, generally, to get the Page ID integer.
                if (!prop) {
                    prop = "id";
                }

                if (prop == "id") {
                    var page_id;
console.log('get page id A');
                    //hack to accomodate the dirty - hash=="page"
                    if(hashOrObject == "page"){
                        // hack salvage data
                        page_id = $('.rdr_window').data('container').attr('rdr-page-id');
console.log('get page id A1');
                        return parseInt(page_id, 10);
                    }
console.log('get page id B');
                    // this code is to accommodate passing in either a hash (string) or jquery element to 
                    if (typeof hashOrObject == "object") {
console.log('get page id B1');
                        // if ( $(hashOrObject).closest('[rdr-page-container]').length && $(hashOrObject).closest('[rdr-page-container]').data('page_id') ) {
                        if ( $(hashOrObject).closest('[rdr-page-container]').length ) {
console.log('get page id B1.1');
                            return parseInt( $(hashOrObject).closest('[rdr-page-container]').attr('rdr-page-container') );
                        }
                    } else if (!hashOrObject) {
console.log('get page id B2');
                        // whiskey tango foxtrot
                        // return false;
                        // return $('[rdr-page-container]').eq(0).data('page_id');
                        return $('[rdr-page-container]').eq(0).attr('rdr-page-container');
                    }
console.log('get page id C');                    
                    if ( typeof hashOrObject == "string" ) {
                        var hash = hashOrObject;
                        var $objWithHash = $('[rdr-hash="'+hash+'"]');
                    }
console.log('get page id D');                    
                    // do we already have the page_id stored on this element, or do we need to walk up the tree to find one?
                    // so foxtrot ugly
                    var page_id = ( $objWithHash.data('page_id') ) ? $objWithHash.data('page_id') : ( $objWithHash.closest('[rdr-page-container]').length ) ? $objWithHash.closest('[rdr-page-container]').attr('rdr-page-container'):$('body').attr('rdr-page-container');
console.log('get page id E');
                    // store the page_id on this node to prevent walking-up again later
                    if ( $objWithHash.hasAttr('rdr-page-container') && !$objWithHash.data('page_id') ) {
console.log('get page id E1');
                        $objWithHash.data('page_id', page_id);
                    }
console.log('get page id F');
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
                    return page_url;
                    // return $.trim( page_url.toLowerCase() );
                }

                // what is the stated canonical?
                if (prop == "canonical_url") {
                    var canonical_url = $('link[rel="canonical"]').length > 0 ?
                                $('link[rel="canonical"]').attr('href') : page_url;
                    
                    canonical_url = $.trim( canonical_url.toLowerCase() );

                    if (canonical_url == RDR.util.getPageProperty('page_url') ) {
                        canonical_url = "same";
                    }

                    // fastco fix (since they sometimes rewrite their canonical to simply be their TLD.)
                    // in the case where canonical claims TLD but we're actually on an article... set canonical to be the page_url
                    var tld = $.trim(window.location.protocol+'//'+window.location.hostname+'/').toLowerCase();
                    if ( canonical_url == tld ) {
                        if (page_url != tld) {
                            canonical_url = page_url;
                        }
                    }

                    return $.trim(canonical_url);
                }
            },
            buildInteractionData: function() {
                //RDR.util.buildInteractionData
                /*


                In short, the following code blows chunks.
                Can't wait for the MVVC rewrite.

                this just circles through a bunch of crap and rebuilds the RDR.interaction_data object


                */
                $.each( RDR.summaries, function(hash, summary) {
                    $.each( summary.top_interactions.tags, function(tag_id,interaction) {
                        if ( typeof RDR.summaries[ hash ].content_nodes != "undefined" ) {
                            $.each( RDR.summaries[ hash ].content_nodes, function(node_id, node) {
                                if ( typeof node.top_interactions.tags != "undefined" && typeof node.top_interactions.tags[ tag_id ] != "undefined" ) {
                                    var this_interaction = node.top_interactions.tags[ tag_id ];
                                    if ( typeof RDR.interaction_data[ tag_id ] == "undefined" ) {RDR.interaction_data[ tag_id ] = {}; }
                                    if ( typeof RDR.interaction_data[ tag_id ][ this_interaction.parent_id ] == "undefined" ) { RDR.interaction_data[ tag_id ][ this_interaction.parent_id ] = {}; }
                                    RDR.interaction_data[ tag_id ][ this_interaction.parent_id ].hash = hash;
                                    RDR.interaction_data[ tag_id ][ this_interaction.parent_id ].container_id = summary.id;
                                    RDR.interaction_data[ tag_id ][ this_interaction.parent_id ].tag = { body:this_interaction.body, id:tag_id};
                                    RDR.interaction_data[ tag_id ][ this_interaction.parent_id ].kind = summary.kind;
                                    
                                    // this content node's content, location is what we want
                                    RDR.interaction_data[ tag_id ][ this_interaction.parent_id ].interaction = { id:this_interaction.parent_id, count:this_interaction.count, body:this_interaction.body};
                                    RDR.interaction_data[ tag_id ][ this_interaction.parent_id ].content_node = { body:node.body, location:node.location, selState:node.selState };
                                }
                            });
                        }
                    });
                });
            },
            stayInWindow: function(settings) {

               var rWin = $(window),
                    winWidth = rWin.width(),
                    winHeight = rWin.height(),
                    winScroll = rWin.scrollTop(),
                    w = settings.width,
                    h = settings.height,
                    coords = settings.coords,
                    paddingY = settings.paddingY || 10,
                    paddingX = settings.paddingX || 10,
                    ignoreWindowEdges = (settings.ignoreWindowEdges) ? settings.ignoreWindowEdges:""; // ignoreWindowEdges - check for index of t, r, b, l

                if ( ( ignoreWindowEdges.indexOf('r') == -1 ) && (coords.left+w+16) >= (winWidth - paddingX) ) {
                    coords.left = winWidth - w - paddingX;
                }
                if ( ( ignoreWindowEdges.indexOf('b') == -1 ) &&  (coords.top+h) > (winHeight + winScroll - paddingY ) ) {
                    coords.top = winHeight + winScroll - h - paddingY;
                }
                if ( ( ignoreWindowEdges.indexOf('l') == -1 ) && coords.left < paddingX ) {
                    coords.left = paddingX;
                }
                if ( ( ignoreWindowEdges.indexOf('t') == -1 ) && coords.top < (winScroll + paddingY) ) {
                    coords.top = winScroll + paddingY;
                }

                return coords;
            },
            md5: {
                hexcase:0,
                b64pad:"",
                chrsz:8,
                hex_md5: function(s){return RDR.util.md5.binl2hex(RDR.util.md5.core_md5(RDR.util.md5.str2binl(s),s.length*RDR.util.md5.chrsz));},
                core_md5: function(x,len){x[len>>5]|=0x80<<((len)%32);x[(((len+64)>>>9)<<4)+14]=len;var a=1732584193;var b=-271733879;var c=-1732584194;var d=271733878;for(var i=0;i<x.length;i+=16){var olda=a;var oldb=b;var oldc=c;var oldd=d;a=RDR.util.md5.md5_ff(a,b,c,d,x[i+0],7,-680876936);d=RDR.util.md5.md5_ff(d,a,b,c,x[i+1],12,-389564586);c=RDR.util.md5.md5_ff(c,d,a,b,x[i+2],17,606105819);b=RDR.util.md5.md5_ff(b,c,d,a,x[i+3],22,-1044525330);a=RDR.util.md5.md5_ff(a,b,c,d,x[i+4],7,-176418897);d=RDR.util.md5.md5_ff(d,a,b,c,x[i+5],12,1200080426);c=RDR.util.md5.md5_ff(c,d,a,b,x[i+6],17,-1473231341);b=RDR.util.md5.md5_ff(b,c,d,a,x[i+7],22,-45705983);a=RDR.util.md5.md5_ff(a,b,c,d,x[i+8],7,1770035416);d=RDR.util.md5.md5_ff(d,a,b,c,x[i+9],12,-1958414417);c=RDR.util.md5.md5_ff(c,d,a,b,x[i+10],17,-42063);b=RDR.util.md5.md5_ff(b,c,d,a,x[i+11],22,-1990404162);a=RDR.util.md5.md5_ff(a,b,c,d,x[i+12],7,1804603682);d=RDR.util.md5.md5_ff(d,a,b,c,x[i+13],12,-40341101);c=RDR.util.md5.md5_ff(c,d,a,b,x[i+14],17,-1502002290);b=RDR.util.md5.md5_ff(b,c,d,a,x[i+15],22,1236535329);a=RDR.util.md5.md5_gg(a,b,c,d,x[i+1],5,-165796510);d=RDR.util.md5.md5_gg(d,a,b,c,x[i+6],9,-1069501632);c=RDR.util.md5.md5_gg(c,d,a,b,x[i+11],14,643717713);b=RDR.util.md5.md5_gg(b,c,d,a,x[i+0],20,-373897302);a=RDR.util.md5.md5_gg(a,b,c,d,x[i+5],5,-701558691);d=RDR.util.md5.md5_gg(d,a,b,c,x[i+10],9,38016083);c=RDR.util.md5.md5_gg(c,d,a,b,x[i+15],14,-660478335);b=RDR.util.md5.md5_gg(b,c,d,a,x[i+4],20,-405537848);a=RDR.util.md5.md5_gg(a,b,c,d,x[i+9],5,568446438);d=RDR.util.md5.md5_gg(d,a,b,c,x[i+14],9,-1019803690);c=RDR.util.md5.md5_gg(c,d,a,b,x[i+3],14,-187363961);b=RDR.util.md5.md5_gg(b,c,d,a,x[i+8],20,1163531501);a=RDR.util.md5.md5_gg(a,b,c,d,x[i+13],5,-1444681467);d=RDR.util.md5.md5_gg(d,a,b,c,x[i+2],9,-51403784);c=RDR.util.md5.md5_gg(c,d,a,b,x[i+7],14,1735328473);b=RDR.util.md5.md5_gg(b,c,d,a,x[i+12],20,-1926607734);a=RDR.util.md5.md5_hh(a,b,c,d,x[i+5],4,-378558);d=RDR.util.md5.md5_hh(d,a,b,c,x[i+8],11,-2022574463);c=RDR.util.md5.md5_hh(c,d,a,b,x[i+11],16,1839030562);b=RDR.util.md5.md5_hh(b,c,d,a,x[i+14],23,-35309556);a=RDR.util.md5.md5_hh(a,b,c,d,x[i+1],4,-1530992060);d=RDR.util.md5.md5_hh(d,a,b,c,x[i+4],11,1272893353);c=RDR.util.md5.md5_hh(c,d,a,b,x[i+7],16,-155497632);b=RDR.util.md5.md5_hh(b,c,d,a,x[i+10],23,-1094730640);a=RDR.util.md5.md5_hh(a,b,c,d,x[i+13],4,681279174);d=RDR.util.md5.md5_hh(d,a,b,c,x[i+0],11,-358537222);c=RDR.util.md5.md5_hh(c,d,a,b,x[i+3],16,-722521979);b=RDR.util.md5.md5_hh(b,c,d,a,x[i+6],23,76029189);a=RDR.util.md5.md5_hh(a,b,c,d,x[i+9],4,-640364487);d=RDR.util.md5.md5_hh(d,a,b,c,x[i+12],11,-421815835);c=RDR.util.md5.md5_hh(c,d,a,b,x[i+15],16,530742520);b=RDR.util.md5.md5_hh(b,c,d,a,x[i+2],23,-995338651);a=RDR.util.md5.md5_ii(a,b,c,d,x[i+0],6,-198630844);d=RDR.util.md5.md5_ii(d,a,b,c,x[i+7],10,1126891415);c=RDR.util.md5.md5_ii(c,d,a,b,x[i+14],15,-1416354905);b=RDR.util.md5.md5_ii(b,c,d,a,x[i+5],21,-57434055);a=RDR.util.md5.md5_ii(a,b,c,d,x[i+12],6,1700485571);d=RDR.util.md5.md5_ii(d,a,b,c,x[i+3],10,-1894986606);c=RDR.util.md5.md5_ii(c,d,a,b,x[i+10],15,-1051523);b=RDR.util.md5.md5_ii(b,c,d,a,x[i+1],21,-2054922799);a=RDR.util.md5.md5_ii(a,b,c,d,x[i+8],6,1873313359);d=RDR.util.md5.md5_ii(d,a,b,c,x[i+15],10,-30611744);c=RDR.util.md5.md5_ii(c,d,a,b,x[i+6],15,-1560198380);b=RDR.util.md5.md5_ii(b,c,d,a,x[i+13],21,1309151649);a=RDR.util.md5.md5_ii(a,b,c,d,x[i+4],6,-145523070);d=RDR.util.md5.md5_ii(d,a,b,c,x[i+11],10,-1120210379);c=RDR.util.md5.md5_ii(c,d,a,b,x[i+2],15,718787259);b=RDR.util.md5.md5_ii(b,c,d,a,x[i+9],21,-343485551);a=RDR.util.md5.safe_add(a,olda);b=RDR.util.md5.safe_add(b,oldb);c=RDR.util.md5.safe_add(c,oldc);d=RDR.util.md5.safe_add(d,oldd);} return Array(a,b,c,d);},
                md5_cmn: function(q,a,b,x,s,t){return RDR.util.md5.safe_add(RDR.util.md5.bit_rol(RDR.util.md5.safe_add(RDR.util.md5.safe_add(a,q),RDR.util.md5.safe_add(x,t)),s),b);},
                md5_ff: function(a,b,c,d,x,s,t){return RDR.util.md5.md5_cmn((b&c)|((~b)&d),a,b,x,s,t);},
                md5_gg: function(a,b,c,d,x,s,t){return RDR.util.md5.md5_cmn((b&d)|(c&(~d)),a,b,x,s,t);},
                md5_hh: function(a,b,c,d,x,s,t){return RDR.util.md5.md5_cmn(b^c^d,a,b,x,s,t);},
                md5_ii: function(a,b,c,d,x,s,t){return RDR.util.md5.md5_cmn(c^(b|(~d)),a,b,x,s,t);},
                safe_add: function(x,y){var lsw=(x&0xFFFF)+(y&0xFFFF);var msw=(x>>16)+(y>>16)+(lsw>>16);return(msw<<16)|(lsw&0xFFFF);},
                bit_rol: function(num,cnt){return(num<<cnt)|(num>>>(32-cnt));},
                //the line below is called out by jsLint because it uses Array() instead of [].  We can ignore, or I'm sure we could change it if we wanted to.
                str2binl: function(str){var bin=Array();var mask=(1<<RDR.util.md5.chrsz)-1;for(var i=0;i<str.length*RDR.util.md5.chrsz;i+=RDR.util.md5.chrsz){bin[i>>5]|=(str.charCodeAt(i/RDR.util.md5.chrsz)&mask)<<(i%32);}return bin;},
                binl2hex: function(binarray){var hex_tab=RDR.util.md5.hexcase?"0123456789ABCDEF":"0123456789abcdef";var str="";for(var i=0;i<binarray.length*4;i++){str+=hex_tab.charAt((binarray[i>>2]>>((i%4)*8+4))&0xF)+hex_tab.charAt((binarray[i>>2]>>((i%4)*8))&0xF);} return str;}
            },
            getCleanText: function($domNode) {
                // RDR.util.getCleanText
                // common function for cleaning the text node text.  right now, it's removing spaces, tabs, newlines, and then double spaces
                
                var $node = $domNode.clone();

                $node.find('.rdr, .rdr-custom-cta-container').remove();

                //make sure it doesnt alredy have in indicator - it shouldn't.
                var $indicator = $node.find('.rdr_indicator');
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
                //RDR.util.cssSuperImportant:
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
                        RDR.util.parseCssAttrToDict( existingStyle ),
                        cssDict
                    );

                $.each(newStyleDict,function(key,val){
                    inlineStyleStr += (key+ ':' +val+";");
                });
                $domNode.attr('style', inlineStyleStr);
                return $domNode; //return the node for the hell of it.
            },
            parseCssAttrToDict: function(inlineStyleStr){
                //RDR.util.parseCssAttrToDict:
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
                // RDR.util.fixBrTags:

                //find the $sections through br tags that are in the scoped section.
                var $sections = $(RDR.group.br_replace_scope_selector).find('> br').parent();

                if(!$sections.length){
                    return;
                }
                //arbitrary unique string
                var marker = "|rdr|br|/rdr|";

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
                        $dummySection.append('<div class="rdr_br_replaced">'+innerText+'</div>');
                    }

                    $this
                      .addClass('rdr_br_replaced_section')
                      .html($dummySection.html());
                });
            },

            fixBodyBorderOffsetIssue: function(){
                //RDR.util.fixBodyBorderOffsetIssue:
                //a fix for the rare case where the body element has a border on it.
                //this is needed because jQuery's offset doesn't account for that.
                //suposedly it also doesn't account for margin or padding on the body, but a fix for those doesnt' seem to be needed.

                //todo: this works fine for now - makes the indicators look right on hypervocal,
                    //but there is still a little functionality outside the sandbox that should be incorporated into this fix.
                    //for example - the stay-in-window function doesn't compensate for the body border, but it doens't matter for a small border anyway.

                var $body = $('body'),
                    borderTop = parseInt( $body.css('border-top-width'), 10 ),
                    borderLeft = parseInt( $body.css('border-left-width'), 10 ),
                    $sandbox = $('#rdr_sandbox');

                if( !borderTop && !borderLeft ) return;
                //else

                RDR.util.cssSuperImportant($sandbox, {
                    top: borderTop+'px',
                    left: borderLeft+'px'
                });

            },
            //_.throttle returns a function
            throttledUpdateContainerTrackers: function(){
                return RDR.util._.throttle(
                    //RDR.util.throttledUpdateContainerTrackers
                    RDR.actions.indicators.utils.updateContainerTrackers,
                    100
                );
            },
            userLoginState: function() {
                //RDR.util.userLoginState
                if ( !$('#rdr-user').length ) {
                    $('.rdr-page-summary').find('div.rdr-summary').prepend('<div id="rdr-user" />');
                }
                if ( RDR && RDR.user && RDR.user.full_name && $('.rdr-page-summary.defaultSummaryBar').length ) {
                    var name = (RDR.user.user_type == "facebook") ? ( RDR.user.full_name.split(' ')[0] ) : RDR.user.full_name;
                    $('#rdr-user').html('Hi, <a href="'+RDR_baseUrl+'/user/'+RDR.user.user_id+'" target="_blank">'+name+'</a>');
                } else {
                    $('#rdr-user').html('<a href="javascript:void(0);">Log in to ReadrBoard</a>');
                    $('#rdr-user').find('a').click( function() { RDR.session.showLoginPanel(); } );
                }
            },

            objLength: function(obj) {
                // RDR.util.objLength:
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
                //RDR.util._:
            
                // Returns a function, that, as long as it continues to be invoked, will not
                // be triggered. The function will be called after it stops being called for
                // N milliseconds.
                debounce: function(func, wait) {
                    //RDR.util._.debounce:
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
                    //RDR.util._.throttle:

                    //fake the underscore stuff
                    var _ = {};
                    _.debounce = RDR.util._.debounce;

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
                    //RDR.util._.once:
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
                //RDR.util.getQueryParams:

                //thanks: http://stackoverflow.com/a/2880929/1289255
                //I haven't verfied that this is 100% perfect for every url case, but it's solid.
                
                //this function is also in readr_scripts
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
                //RDR.util.createGuid
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            },
            killSessions: function() {
                //RDR.util.killSessions
                localStorage.removeItem('rdr_sts');
                localStorage.removeItem('rdr_lts');
                RDR.user.sts = null;
                RDR.user.lts = null;
            },
            checkSessions: function() {
                //RDR.util.checkSessions
                var rdr_sts = JSON.parse( localStorage.getItem('rdr_sts') );  // short term session
                var rdr_lts = localStorage.getItem('rdr_lts'); // long term session

                // check/set session localStorages
                if( !rdr_sts || new Date().getTime() > rdr_sts.expires ) {
                    var short_session_guid = RDR.user.sts = RDR.util.createGuid();
                    var short_session_expiretime = new Date();
                    var minutes = 15;
                    short_session_expiretime.setTime(short_session_expiretime.getTime() + (minutes * 60 * 1000));

                    var new_rdr_sts = {guid: short_session_guid, expires: short_session_expiretime.getTime() }
                    localStorage.setItem('rdr_sts', JSON.stringify(new_rdr_sts) );
                    
                    // $.clog('rs sts 1', short_session_guid );
                    // $.cookie('rdr_sts', short_session_guid, { expires: short_session_expiretime });
                } else {

                    RDR.user.sts = rdr_sts.guid;

                    // lets extend the session time 
                    var minutes = 10;
                    var short_session_expiretime = new Date();
                    short_session_expiretime.setTime(short_session_expiretime.getTime() + (minutes * 60 * 1000));
                    // $.clog('rs sts 2', RDR.user.sts );
                    // $.cookie('rdr_sts', RDR.user.sts, { expires: short_session_expiretime });

                    var new_rdr_sts = {guid: RDR.user.sts, expires: short_session_expiretime.getTime() }
                    localStorage.setItem('rdr_sts', JSON.stringify(new_rdr_sts) );
                }

                if( !rdr_lts ) {
                    var long_session_guid = RDR.user.lts = RDR.util.createGuid();
                    // var long_session_expiretime = new Date();
                    // var days = 180;
                    // long_session_expiretime.setTime(long_session_expiretime.getTime() + (days * 60 * 1000 * 60 * 24));
                    // $.clog('rs lts 1', long_session_guid ); 
                    // $.cookie('rdr_lts', long_session_guid, { expires: long_session_expiretime });

                    // var new_rdr_lts = {guid: long_session_guid, expires: short_session_expiretime }
                    localStorage.setItem('rdr_lts', long_session_guid );
                } else {
                    RDR.user.lts = rdr_lts;
                    // $.clog('rs lts 2', RDR.user.lts ); 

                    //////////// buggy when i reset this cookie's time, too, so not doing it for now::::
                    // lets extend the session time 
                    // var days = 180;
                    // var long_session_expiretime = new Date();
                    // long_session_expiretime.setTime(long_session_expiretime.getTime() + (days * 60 * 1000 * 60 * 24));
                    // $.cookie('rdr_lts', RDR.user.long_session_guid, { expires: long_session_expiretime });
                }
            }
        },
        debug: function(){
            window.RDR = window.READRBOARDCOM;
            window.$RDR = $RDR;
            window.$R = $R;
        },
        toggle: function(){
            $R('body').toggleClass('no-rdr');
        },
        getLastEvent: function() {
            if (RDR.group.premium == true) {
                return {
                    'event':(RDR.events.lastEvent) ? RDR.events.lastEvent:'',
                    'value':(RDR.events.lastValue) ? RDR.events.lastValue:'',
                    'supplementary':(RDR.events.lastSupplementary) ? RDR.events.lastSupplementary:{}
                };
            }
        },
        session: {
            alertBar: {
                make: function( whichAlert, data) {
                    // RDR.session.alertBar.make:
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
                        
                        $msg1 = $('<h1>Shared with <span>ReadrBoard</span></h1>');

                        if ( $('img[rdr-hash="'+data.container_hash+'"]').length == 1 ) {
                            $msg2 = $('<div><strong class="reactionText">Reaction: <em>' + data.reaction + '</em></strong>'+
                                ' <a class="rdr_showSelection" href="javascript:void(0);"><img src="' + data.content + '" style="max-width:100px !important;max-height:70px !important;margin:5px 0 !important;display:block !important;" />'+
                                ' <strong class="seeItLinkText rdr_blue">Show it on the page</strong></a></div>');
                        } else {
                            //put a better message here
                            $msg2 = $('<div><strong class="reactionText">Reaction: <em>' + data.reaction + '</em></strong>'+
                                '<strong>"</strong><em>' + decodedContent.substr(0,140) + '...</em><strong>"</strong>'+
                                '<br /><strong class="seeItLinkText"><a class="rdr_showSelection" href="javascript:void(0);">Show it on the page</a></strong></div>');
                        }
                        $msg2.find('a.rdr_showSelection').click( function() {
                            //show the alertBar sliding closed for just a second before scrolling down..
                            // RDR.session.alertBar.close();
                            setTimeout(function(){
                                RDR.session.revealSharedContent(data);
                            }, 200);
                        });
                    }
                    if( whichAlert == "showMorePins"){
                        //put a better message here
                        $msg1 = $('<h1>See <span>more reactions</span> on this page.</h1>');
                        $msg2 = $('<div>Readers like you are reacting to, sharing, and discussing content on this page.  <a class="rdr_show_more_pins" href="javascript:void(0);">Click here</a> to see what they\'re saying.<br><br><strong>Tip:</strong> Look for the <img src="'+RDR_staticUrl+'widget/images/blank.png" class="no-rdr rdr_pin" /> icons.</div>');

                        $msg2.find('a.rdr_show_more_pins').click( function() {
                            RDR.actions.summaries.showLessPopularIndicators();
                            $(this).closest('div.rdr_alert_box').find('div.rdr_alert_box_x').click();
                        });
                    }
                    if (typeof $msg1 != "undefined" ) {
                        $pinIcon = $('<img src="'+RDR_staticUrl+'widget/images/blank.png" class="no-rdr rdr_pin" />');

                        var $alertContent = $('<div class="rdr_alert_box rdr rdr_' + whichAlert + '" />');

                        $alertContent.append(
                            $('<div class="rdr_alert_box_1" />').append($pinIcon).append($msg1),
                            $('<div class="rdr_alert_box_2" />').append($msg2),
                            '<div class="rdr rdr_alert_box_x">x</div>'
                        );

                        $('#rdr_sandbox').append( $alertContent );
                        $('div.rdr_alert_box.rdr_'+whichAlert).find('.rdr_alert_box_x').click( function() {
                            RDR.session.alertBar.close( whichAlert );
                        });

                        // TODO put this back in
                        $('div.rdr_alert_box.rdr_'+whichAlert).animate({top:-5},1000);
                    }
                },
                close: function( whichAlert ) {
                    //RDR.session.alertBar.close:
                    $('div.rdr_alert_box.rdr_'+whichAlert).remove();

                    //brute force for now -
                    //if they click the X we need this;
                    $('div.rdr_indicator_for_media').hide();
                    // RDR.actions.indicators.utils.borderHilites.disengageAll();
                    
                    // set a localStorage in the iframe saying not to show this anymore
                    $.postMessage(
                        "close "+whichAlert,
                        RDR_baseUrl + "/static/xdm.html",
                        window.frames['rdr-xdm-hidden']
                    );
                }
            },
            revealSharedContent: function(data){
                var hash = data.container_hash,
                    $container = $('[rdr-hash="'+hash+'"]');

                var kind = $container.data('kind');

                if(kind == 'img' || kind == 'media' || kind == 'med'){
                    $container.addClass('rdr_shared');
                    RDR.actions.indicators.utils.updateContainerTracker(hash);
                    // RDR.actions.indicators.utils.borderHilites.engage(hash, true);
                }

                if ( data.location && data.location != "None" ) {


                    var serialRange = data.location;

                    var selogStack = $().selog('stack'); //just fyi, not using it... Will be an empty stack on page load.

                    var selState = $container.selog('save', {'serialRange':serialRange} );
                    $().selog('hilite', selState, 'on');

                    $('div.rdr_page_summary').remove();
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
                if ( localStorage.getItem('rdr_content_type') != 'pag' ) {
                    
                    // quick fix
                    // todo  - do this better later;
                    var containerHash = data.container_hash;
                    var pageHasContainer = !! RDR.containers[containerHash];
                    if (!pageHasContainer){
                        return;
                    }
                    
                    RDR.session.alertBar.make('fromShareLink', data);
                    return true; //could return something more useful if we need it.
                }
            },
            getUser: function(args, callback) {
                if ( callback && args ) {
                    RDR.session.receiveMessage( args, callback );
                } else if ( callback ) {
                    RDR.session.receiveMessage( false, callback );
                }

                $.postMessage(
                    "getUser",
                    RDR_baseUrl + "/static/xdm.html",
                    window.frames['rdr-xdm-hidden']
                );
            },
            handleGetUserFail: function(args, callback) {
                var response = args.response;
                switch ( response.message ) {
                    case "Error getting user!":
                        // kill the user object and localStorage
                        RDR.session.killUser();
                        // TODO tell the user something failed and ask them to try again
                        // pass callback into the login panel
                    break;

                    case "Temporary user interaction limit reached":
                        // TODO: something.  anything at all.
                        RDR.session.showLoginPanel( args, callback );
                    break;
                    case "Container specified does not exist":
                    break;

                    case "Token was invalid":
                    case "Facebook token expired":  // call fb login
                    case "FB graph error - token invalid":  // call fb login
                    case "Social Auth does not exist for user": // call fb login
                    case "Data to create token is missing": // call fb login
                        if ( typeof RDR.user.user_type != "undefined" && RDR.user.user_type == "readrboard") {
                            RDR.session.showLoginPanel( args, callback );
                        } else {
                            // the token is out of sync.  could be a mistake or a hack.
                            RDR.session.receiveMessage( args, callback );
                            // RDR.session.showLoginPanel( args, callback );
                            $.postMessage(
                                "reauthUser",
                                // "killUser",
                                RDR_baseUrl + "/static/xdm.html",
                                window.frames['rdr-xdm-hidden']
                            );
                        }

                        // // init a new receiveMessage handler to fire this callback if it's successful
                    break;
                }
            },
            createXDMframe: function() {
                RDR.session.receiveMessage({}, function() {
                    RDR.util.userLoginState();
                });

                var iframeUrl = RDR_baseUrl + "/static/xdm.html",
                parentUrl = window.location.href,
                parentHost = window.location.protocol + "//" + window.location.host,
                bookmarklet = ( RDR.engageScriptParams.bookmarklet ) ? "bookmarklet=true":"",
                $xdmIframe = $('<iframe id="rdr-xdm-hidden" name="rdr-xdm-hidden" src="' + iframeUrl + '?parentUrl=' + parentUrl + '&parentHost=' + parentHost + '&group_id='+RDR.group.id+'&group_name='+encodeURIComponent(RDR.group.name)+'&'+bookmarklet+'" width="1" height="1" style="position:absolute;top:-1000px;left:-1000px;" />'
                );
                $('#rdr_sandbox').append( $xdmIframe );


                // this is the postMessage receiver for ALL messages posted.
                // TODO: put this elsewhere so it's more logically placed and easier to find??

                $RDR.dequeue('initAjax');
            },
            receiveMessage: function(args, callbackFunction) {
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
                                    RDR.user = RDR.user || {};
                                    if ( i == "user_boards" ) {
                                        RDR.user.user_boards = $.evalJSON( message.data[i] );
                                    } else {
                                        RDR.user[ i ] = ( !isNaN( message.data[i] ) ) ? parseInt(message.data[i],10):message.data[i];
                                    }
                                }

                                if ( callbackFunction && args ) {
                                    
                                    //quick fix for page level data
                                    if(!args.kind && args.rindow){
                                        args.kind = $(args.rindow).data('kind');
                                    }
                                    args.user = RDR.user;
                                    callbackFunction(args);
                                    callbackFunction = null;
                                }
                                else if ( callbackFunction ) {
                                    callbackFunction();
                                    callbackFunction = null;
                                }

                                RDR.util.userLoginState();

                            } else if ( message.status == "xdm loaded" ) {
                                RDR.group.xdmLoaded = true;
                                RDR.events.fireEventQueue();
                            } else if ( message.status == "board_created" ) {
                                $('div.rdr-board-create-div').remove();
                            } else if ( message.status == "board_create_cancel" ) {
                                clearInterval( RDR.checkingBoardWindow );
                                $('div.rdr-board-create-div').remove();
                            } else if ( message.status == "getUserLoginState" ) {
                                RDR.session.getUser();

                                //I would think this needs to get added as a callback to the function above, but looks like we don't need it.
                                // RDR.util.userLoginState();

                                $('#rdr_loginPanel').remove();
                            } else if ( message.status == "fb_user_needs_to_login" ) {
                                if ( callbackFunction && args ) {
                                    RDR.session.showLoginPanel( args, callbackFunction );
                                } else {
                                    RDR.session.showLoginPanel( args );
                                }
                            } else if ( message.status == "close login panel" ) {
                                RDR.util.userLoginState();
                                $('#rdr_loginPanel').remove(); // little brute force, maybe should go elsewhere?
                                $('div.rdr-summary div.rdr_info').html('<em>You\'re logged in!  Try your last reaction again.');
                            } else if ( message.status == "already had user" ) {
                                // todo: when is this used?
                                $('#rdr_loginPanel div.rdr_body').html( '<div style="padding: 5px 0; margin:0 8px; border-top:1px solid #ccc;"><strong>Welcome!</strong> You\'re logged in.</div>' );
                            // } else if ( message.status == "educate user" ) {
                                // RDR.session.alertBar.make('educateUser');
                            } else if ( message.status.indexOf('sharedLink') != -1 ) {
                                var sharedLink = message.status.split('|');
                                if ( sharedLink[5] ) {
                                    RDR.session.referring_int_id = parseInt( sharedLink[5], 10 ); // TODO what is this used for any more?
                                }
                                // TODO sharedLink[6] is SHARE HACK REMOVE THIS DAILYCANDY ONLY
                                RDR.session.getSharedLinkInfo( { container_hash:sharedLink[1], location:sharedLink[2], reaction:sharedLink[3], content:sharedLink[4], page_hash:sharedLink[6] } );
                            }
                        }
                    },
                    RDR_baseUrl
                );
            },
            login: function() {},
            checkForMaxInteractions: function(){
                RDR.user = RDR.user || {};
                var isTempUser = !RDR.user.user_type
                if ( isTempUser && RDR.user.num_interactions && RDR.user.num_interactions >= RDR.group.temp_interact ) {
                  return true;
                }
                return false;
            },
            showLoginPanel: function(args, callback) {
             // RDR.session.showLoginPanel

                $('.rdr_rewritable').removeClass('rdr_rewritable');

                if ( $('#rdr_loginPanel').length < 1 ) {
                    // $('#rdr_loginPanel').remove();
                    //todo: weird, why did commenting this line out not do anything?...look into it
                    //porter says: the action bar used to just animate larger and get populated as a window
                    //$('div.rdr.rdr_actionbar').removeClass('rdr_actionbar').addClass('rdr_window').addClass('rdr_rewritable');

                    var coords;

                    if ( args && args.rindow ) {
                        var caller = args.rindow;
                        coords = caller.offset();
                        coords.left = coords.left ? (coords.left-34) : 100;
                        coords.top = coords.top ? (coords.top-25) : 100;
                    } else {
                        coords = [];
                        coords.left = ( $(window).width() / 2 ) - 200;
                        coords.top = 150 + $(window).scrollTop();
                    }


                    var $rindow = RDR.rindow.draw({
                        coords:coords,
                        id: "rdr_loginPanel",
                        // pnlWidth:360,
                        pnls:1,
                        height:175,
                        ignoreWindowEdges:"bt"
                    });


                    RDR.rindow.tagBox.setWidth( $rindow, 480 );

                    // store the arguments and callback function that were in progress when this Login panel was called
                    if ( args ) $rindow.data( 'args', args );
                    if ( callback ) $rindow.data( 'callback', callback );

                    // create the iframe containing the login panel
                    // var $loginHtml = $('<div class="rdr_login" />'),
                    var iframeUrl = RDR_baseUrl + "/static/fb_login.html",
                        parentUrl = window.location.href,
                        parentHost = window.location.protocol + "//" + window.location.host,
                        h1_text = ( args && args.response && args.response.message.indexOf('Temporary user interaction') != -1 ) ? "Log In to Continue Reacting":"Log In to ReadrBoard",
                        $loginIframe = $('<iframe id="rdr-xdm-login" src="' + iframeUrl + '?parentUrl=' + parentUrl + '&parentHost=' + parentHost + '&group_id='+RDR.group.id+'&group_name='+RDR.group.name+'" width="480" height="140" frameborder="0" style="overflow:hidden; width:480px !important;" />' );
                        
                    if ( args && args.response && args.response.message.indexOf('organic') != -1 ) {
                        h1_text = "Signing in is required for custom reactions";
                    }
                    var $header = RDR.rindow.makeHeader( h1_text );
                    $rindow.find('.rdr_header').replaceWith($header);
                    RDR.rindow.hideFooter($rindow);
                    $rindow.find('div.rdr_body_wrap').append('<div class="rdr_body" />').append( $loginIframe );

                    // RDR.events.track( 'show_login' );
                }
            },
            killUser: function() {
                RDR.user = {};
                RDR.util.killSessions();
                $.postMessage(
                    "killUser",
                    RDR_baseUrl + "/static/xdm.html",
                    window.frames['rdr-xdm-hidden']
                );
            },
            rindowUserMessage: {
                show:  function(args) {
                    //RDR.session.rindowUserMessage.show:
                    var $rindow = args.rindow;
                    var interactionInfo = args.interactionInfo;

                    if ( $rindow ) {

                        var msgType = args.msgType || null, //defaults to tempUser
                            userMsg = null,
                            actionPastTense;

                        var extraHeight = 45,  //$rindowMsgDiv.height(),
                            bodyWrapHeight = 10,
                            rindowHeight = $rindow.height(),
                            durr = 300;

                        var $bodyWraps = $rindow.find('.rdr_body_wrap');
                        var $rindowMsgDiv = $rindow.find('div.rdr_rindow_message'),
                            $rindowMsgDivInnerwrap = $rindow.find('.rdr_rindow_message_innerwrap'),
                            $otherTagsWrap = $('div.rdr_otherTagsWrap'),
                            $tmpUserMsg = $rindow.find('.rdr_rindow_message_tempUserMsg');

                        $rindowMsgDiv.show();

                        switch (msgType) {

                            case "tempUser":
                                //for now, just ignore this
                                var num_interactions_left = RDR.group.temp_interact - parseInt( args.num_interactions, 10 ),
                                    $loginLink = $('<a href="javascript:void(0);">Connect with Facebook</a>.');

                                $loginLink.click( function() {
                                    RDR.session.showLoginPanel( args );
                                });

                                var tmpUserMsg = 'You can react or comment <strong>' + num_interactions_left + ' more times</strong> before you must ';

                                $tmpUserMsg.empty().append('<span>'+tmpUserMsg+'</span>');
                                $tmpUserMsg.append($loginLink);

                                break;

                            case "existingInteraction":
                                userMsg = "You have already given that reaction for this.";
                                break;
                                

                            case "interactionSuccess":

                                if(interactionInfo.remove){
                                    userMsg = "The "+interactionInfo.type+" <em>"+interactionInfo.body+"</em><br />has been removed." ;
                                    $tmpUserMsg.empty();
                                }else{

                                    userMsg = (interactionInfo.type == 'tag') ?
                                        "You have tagged this <em>"+interactionInfo.body+"</em>." :
                                    (interactionInfo.type == 'comment') ?
                                        "You have left your comment." :
                                        ""; //this default shouldn't happen
                                    userMsg += " See your "+interactionInfo.type+"s on this page, and at <strong><a href='"+RDR_baseUrl+"' target='_blank'>readrboard.com</a></strong>";
                                }

                                var click_args = args;
                                if ( $rindow.find('div.rdr_rindow_message_tempUserMsg').text().length > 0 ) {
                                    $inlineTempMsg = $('<div />');
                                    $inlineTempMsg.html( '<h4 style="font-size:17px;">You can react '+ $rindow.find('div.rdr_rindow_message_tempUserMsg strong').text() +'.</h4><br/><p><a style="font-weight:bold;color:#008be4;" href="javascript:void(0);">Connect with Facebook</a> to react as much as you want &amp; show other readers here what you think.</p><br/><p>Plus, you can share and comment in-line!</p><br/><a href="javascript:void(0);"><img src="'+RDR_staticUrl+'widget/images/fb-login_to_readrboard.png" alt="Connect with Facebook" /></a>');
                                    $inlineTempMsg.find('a').click( function() {
                                        RDR.session.showLoginPanel( click_args );
                                    });

                                }

                                break;

                        }

                        if(userMsg){
                            $rindowMsgDiv.find('span.rdr_userMsg').html( userMsg );
                        }

                        $rindowMsgDivInnerwrap.hide();
                        $rindow.queue('userMessage', function(){
                            if( $rindowMsgDiv.height() > 0 ){
                                //already expanded
                                $rindowMsgDivInnerwrap.fadeIn(500);
                                $(this).dequeue('userMessage');
                            }else{
                                //expand it and expand the window with it.
                                //I know this simo animations together are a bit much - this should be redesigned
                                $rindow.animate({ height: rindowHeight+extraHeight }, durr);
                                $otherTagsWrap.animate({ bottom:0 }, durr);
                                $bodyWraps.animate({
                                    bottom: extraHeight
                                }, durr);
                                $rindowMsgDiv.animate({ height:extraHeight },durr, function(){
                                    $rindowMsgDivInnerwrap.fadeIn(500);
                                    $(this).dequeue('userMessage');
                                });
                            }
                        });
                        $rindow.dequeue('userMessage');
                    }
                },
                hide: function($rindow) {
                    //RDR.session.rindowUserMessage.hide:
                    if ( $rindow ) {

                        var $rindowMsgDiv = $('div.rdr_rindow_message');
                            $otherTagsWrap = $('div.rdr_otherTagsWrap');

                        var $bodyWraps = $rindow.find('.rdr_body_wrap');
                            //else

                            //todo: make this a better solution.  The simultaneous animations might not be ideal.
                            var extraHeight = $rindowMsgDiv.height(),  //$rindowMsgDiv.height(),
                                rindowHeight = $rindow.height(),
                                durr = 300,
                                bodyWrapHeight = 10;

                            //no need to use queue like this here, but this is how we can use it when we need to
                            //expand the rindow first and then slide down the msgBar
                            $rindow.queue('userMessage', function(){
                                $rindow.animate({ height: rindowHeight-extraHeight }, durr);
                                $otherTagsWrap.animate({ bottom: 0-bodyWrapHeight }, durr);
                                $bodyWraps.animate({
                                    bottom: bodyWrapHeight
                                }, durr);
                                $rindowMsgDiv.animate({ height:0 }, durr, function(){
                                    $rindowMsgDiv.hide();
                                    $(this).dequeue('userMessage');
                                });
                            });
                            $rindow.dequeue('userMessage');
                    }
                }
            }
        },
        actions: {
            //RDR.actions:
            aboutReadrBoard: function() {
            },
            init: function(){
                //RDR.actions.init:
                var that = this;
                $RDR = $(RDR);
                window.readrboard_extend_per_container = window.readrboard_extend_per_container || {};
                $RDR.queue('initAjax', function(next){
                    that.initGroupData(RDR.group.short_name);
                    //next fired on ajax success
                });
                $RDR.queue('initAjax', function(next){
                   //run this before initPageData.  There was a race condition
                   that.initEnvironment();
                   //next fired on ajax success
                });
                $RDR.queue('initAjax', function(next){
                   that.handleDeprecated();
                   //next fired on ajax success
                });
                $RDR.queue('initAjax', function(next){
                   that.initSeparateCtas();
                   //next fired on ajax success
                });
                $RDR.queue('initAjax', function(next){
                   that.initHTMLAttributes();
                   //next fired on ajax success
                });
                $RDR.queue('initAjax', function(next){
                    that.initPageData();
                    //next fired on ajax success
                });
                $RDR.queue('initAjax', function(next){
                    RDR.actions.runPostPageInit();

                    // this will check for FB login status, too, and set user data
                    RDR.session.createXDMframe();
                    //next fired on ajax success
                });
                $RDR.queue('initAjax', function(next){
                   RDR.util.checkForSelectedTextAndLaunchRindow();
                   RDR.util.initPublicEvents();
                });
                $RDR.queue('initAjax', function(next){
                   RDR.util.initTouchBrowserSettings();
                });

                //start the dequeue chaindel
                $RDR.dequeue('initAjax');

            },
            initGroupData: function(groupShortName){
                // request the RBGroup Data

                $.ajax({
                    url: RDR_baseUrl+"/api/settings/",
                    type: "get",
                    contentType: "application/json",
                    dataType: "jsonp",
                    data: {
                        json: $.toJSON( {host_name : window.location.hostname} )
                    },
                    success: function(response, textStatus, XHR) {

                        var group_settings = response.data;
                        var custom_group_settings = (RDR.groupSettings) ? RDR.groupSettings.getCustomSettings():{};
                        RDR.group = $.extend({}, RDR.group.defaults, group_settings, custom_group_settings );

                        // handle deprecated .blessed_tags, change to .default_reactions
                        if ( typeof RDR.group.blessed_tags != 'undefined' ) {
                            // use .slice() to copy by value
                            // http://stackoverflow.com/questions/7486085/copying-array-by-value-in-javascript
                            RDR.group.default_reactions = RDR.group.blessed_tags.slice();
                            delete RDR.group.blessed_tags;
                        }

                        if (RDR.group.hideOnMobile === true && isTouchBrowser) {
                            return false;
                        }

                        RDR.group.anno_whitelist += ',div.rdr_br_replaced';

                        $(RDR.group.no_readr).each( function() {
                            var $this = $(this);
                            $this.addClass('no-rdr');
                            $this.find('img').addClass('no-rdr');
                        });

                        // setup the active sections + anno_whitelist (i.e. allowed tags)
                        if ( RDR.group.active_sections == "" ) {
                            RDR.group.active_sections = "body";
                        }

                        var active_sections = RDR.group.active_sections.split(','),
                            active_sections_with_anno_whitelist = "",
                            anno_whitelist = RDR.group.anno_whitelist.split(',');
                        
                        
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

                        RDR.group.active_sections_with_anno_whitelist = active_sections_with_anno_whitelist;
                        

                        // it's not a CSS URL, but rather custom CSS rules.  We should change the name in the model...
                        // this embeds custom CSS.
                        if ( RDR.group.custom_css !== "" ) {
                            $('head').append( $('<style type="text/css">' + RDR.group.custom_css + '</style>') );
                        }

                        $RDR.dequeue('initAjax');

                    },
                    error: function(response) {
                        //for now, ignore error and carry on with mockup
                    }
                });
            },
            initPageData: function(){
                var queryStr = RDR.util.getQueryStrFromUrl(RDR.engageScriptSrc);
                RDR.engageScriptParams = RDR.util.getQueryParams(queryStr);
          
                RDR.group.useDefaultSummaryBar = (
                    RDR.engageScriptParams.bookmarklet &&
                    !$('.rdr-page-summary').length &&
                    // !$(RDR.group.post_selector).length &&
                    !$(RDR.group.summary_widget_selector).length
                );
                
                if (RDR.group.useDefaultSummaryBar){
                    //add a class defaultSummaryBar to show that this is our added rdr-page-summary
                    //and not a publisher added one.
                    $('<div id="rdr-page-summary" class="rdr no-rdr rdr-page-summary defaultSummaryBar"/>').appendTo('body');
                }
                
                // RDR.session.educateUser(); //this function has changed now
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
                    title;

                // temp used as a helper to get the pageurl.
                var pageDict = {};

                var num_posts = 0;

                // if multiple posts, add additional "pages"
                if (   
                        RDR.group.post_selector !== "" &&
                        RDR.group.post_href_selector !== "" && 
                        RDR.group.summary_widget_selector !== ""
                    ) {

                        var $posts = $(RDR.group.post_selector),
                            num_posts = $posts.length;
                        //if $(RDR.group.post_selector).length is 0, this will just do nothing
                        $posts.each( function(){
                            // var key = pagesArr.length;
                            var $post = $(this);
                            var $post_href = $post.find(RDR.group.post_href_selector);

                            var $summary_widget = $post.find(RDR.group.summary_widget_selector).eq(0);

                            function nearWindow($thisPost) {
                                var offsets = $thisPost.offset();
                                var w = window,
                                    d = document,
                                    e = d.documentElement,
                                    g = d.getElementsByTagName('body')[0],
                                    x = w.innerWidth || e.clientWidth || g.clientWidth,
                                    y = w.innerHeight|| e.clientHeight|| g.clientHeight,
                                    top = (d && d.scrollTop  || g && g.scrollTop  || 0),
                                    almostInView = y+top+300;

                                if ( offsets.top < almostInView ) {
                                    return true;
                                } else {
                                    return false;
                                }

                            }
                            if ( $post_href.attr('href') && nearWindow($post) && !$post.hasAttr('rdr-page-checked') ) {
                                $post.attr('rdr-page-checked', true);
                                url = $post_href.attr('href');

                                // IE fix for window.location.origin
                                if (!window.location.origin) {
                                    window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: '');
                                }

                                // does this URL have the origin on it?  or does it just begin with a relative path?
                                if ( url.indexOf(window.location.origin) == -1 ) {
                                    if ( url.substr(0,1) == "/" ) {
                                        url = window.location.origin + url;
                                    } else {
                                        url = window.location.origin + window.location.pathname + url;
                                    }
                                }

                                var urlHash = RDR.util.md5.hex_md5(url);
                                if ( !$post.hasAttr('rdr-page-container') ) {
                                    $post.attr( 'rdr-page-container', 'true' ).attr('rdr-page-key',urlHash);
                                }
                                $summary_widget.attr('rdr-page-widget-key',urlHash);

                                urlsArr.push(url);

                                thisPage = {
                                    group_id: parseInt(RDR.group.id, 10),
                                    url: url,
                                    canonical_url: 'same',
                                    title: $post_href.text()
                                };
                                pagesArr.push(thisPage);
                                pageDict[key] = thisPage;

                                // if ( !$post.hasAttr('rdr-page-container') ) {
                                //     $post.attr( 'rdr-page-container', 'true' ).attr('rdr-page-key',key);
                                // }
                                // $summary_widget.attr('rdr-page-widget-key',key);
                            }
                        });
                }

                // defaults for just one page / main page.  we want this last, so that the larger page call happens last, and nodes are associated with posts first.
                var pageUrl = RDR.util.getPageProperty('page_url');
                
                if ( num_posts === 0 && ($.inArray(pageUrl, urlsArr) == -1 || urlsArr.length == 0) ) {
                    if ( !$( 'body' ).hasAttr('rdr-page-checked') ) {
                        canonical_url = RDR.util.getPageProperty('canonical_url');
                        title = RDR.util.getPageProperty('title');

                        // is this OK?  it is for when the <link rel="canonical" ...> tag has an href like href="//somesite.com/index.html"
                        // if (canonical_url.indexOf('//') === 0) {
                            // canonical_url = canonical_url.substr(2);
                            // canonical_url = window.location.protocol + canonical_url;
                        // }

                        thisPage = {
                            group_id: parseInt(RDR.group.id, 10),
                            url: pageUrl,
                            canonical_url: (pageUrl == canonical_url) ? "same" : canonical_url,
                            title: title
                        };

                        RDR.group.thisPage = thisPage;

                        pagesArr.push(thisPage);
                        key = pagesArr.length-1;
                        // key = RDR.util.md5.hex_md5(pageUrl);
                        pageDict[key] = thisPage;

                        if ( !$( 'body' ).hasAttr('rdr-page-container') ) {
                            $( 'body' ).attr( 'rdr-page-container', 'true' ).attr('rdr-page-key',key).attr('rdr-page-checked', true);
                            // $( 'body' ).attr('rdr-page-key',key).attr('rdr-page-checked', true);;

                            if ( $('.rdr-page-summary').length == 1 ) {
                                $('.rdr-page-summary').attr('rdr-page-widget-key',key);
                            } else {
                                var $widget_key_last = $( 'body' ).find(RDR.group.summary_widget_selector).eq(0);
                                // this seems unnecessary, but, on a blogroll, we don't want to have two widget keys on the first post's summary box
                                if ( $widget_key_last.attr('rdr-page-widget-key') != "0" ) {
                                    $widget_key_last.attr('rdr-page-widget-key', key);
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
                        url: RDR_baseUrl+"/api/page/",
                        type: "get",
                        contentType: "application/json",
                        dataType: "jsonp",
                        data: { json: $.toJSON(sendData) },
                        success: function(response) {
                            // RDR.events.track( 'load' );

                            var load_event_value = '';
                            if (RDR.group.useDefaultSummaryBar){
                                load_event_value = 'def';
                            } else {
                                if (response.data.length === 1) {
                                    load_event_value = 'si';
                                } else if (response.data.length > 1) {
                                    load_event_value = 'mu'
                                } else {
                                    load_event_value = 'unex';
                                }
                            }

                            $.each( response.data, function(idx,page){
                                //todo: it seems like we should use the page.id as the unique identifier instead of introducting 'key' which is just a counter
                                page.url = pageDict[key].url;
                                page.key = RDR.util.md5.hex_md5(page.url);
                                RDR.actions.pages.save(page.id, page);
                                RDR.actions.pages.initPageContainer(page.id);
                            });

                            RDR.events.trackEventToCloud({
                                event_type: 'wl',
                                event_value: load_event_value,
                                page_id: RDR.util.getPageProperty('id')
                            });

                            $RDR.dequeue('initAjax');
                        },
                        error: function(response) {
                            //for now, ignore error and carry on with mockup
                        }
                    });
                }

            },
            runPostPageInit: function(){
                //RDR.actions.runPostPageInit:

                // todo: this is a pretty wide hackey net - rethink later.
                var imgBlackListFilter = (RDR.group.img_blacklist&&RDR.group.img_blacklist!="") ? ':not('+RDR.group.img_blacklist+')':'';

                if(isTouchBrowser){
                    // init the "indicators" for media objects, on mobile only.
                    // so that the image call-to-action is present and populated
                    // $(RDR.group.active_sections).find('embed[rdr-node], video[rdr-node], object[rdr-node], iframe[rdr-node], img[rdr-node]').each( function() {

                    // ensure each text node is hashed and has indicator so that we can engage it
                    $( RDR.group.active_sections_with_anno_whitelist ).each(function(idx, node) {
                        RDR.actions.indicators.init( $(node).attr('rdr-hash') );
                    });

                    $(RDR.group.active_sections).find('embed[rdr-node], video[rdr-node], object[rdr-node], iframe[rdr-node], img[rdr-node],'+RDR.group.anno_whitelist).each( function() {
                        RDR.actions.indicators.init( $(this).attr('rdr-hash') );
                    });

                    if ( !localStorage.getItem('hideDoubleTapMessage') && !RDR.group.hideDoubleTapMessage ) {
                        var double_tap_message = (RDR.group.doubleTapMessage) ? RDR.group.doubleTapMessage : '<strong>Single-tap</strong> any paragraph to respond!<a>Close this</a>',
                            double_tap_message_position = (RDR.group.doubleTapMessagePosition) ? 'rdr_'+RDR.group.doubleTapMessagePosition : 'rdr_bottom',
                            $doubleTapMessage = $('<div class="rdr rdr_mobile_message">'+double_tap_message+'</div>'),
                            $sandbox = $('#rdr_sandbox');

                        $doubleTapMessage.addClass( double_tap_message_position ).on('touchend.rdr', function() {
                            // we should handle settings through localStorage.  will do later.
                            localStorage.setItem('hideDoubleTapMessage', true);
                            $(this).remove();
                        }).appendTo( $sandbox );
                    }

                }else{
                    $(RDR.group.active_sections)
                        .on( 'mouseenter', 'embed, video, object, iframe, img'+imgBlackListFilter, function(){

                            var $this = $(this);
                            
                            var hash = $this.data('hash');

                                RDR.actions.indicators.utils.updateContainerTrackers();

                            if ( $this.closest('.no-rdr').length ) {
                                return;
                            }

                            var minImgWidth = 160;
                            if ( $this.width() >= minImgWidth ) {
                                var hasBeenHashed = $this.hasAttr('rdr-hashed'),
                                    isBlacklisted = $this.closest('.rdr, .no-rdr').length;

                                $this.addClass('rdr_live_hover');

                                if(!hasBeenHashed && !isBlacklisted){

                                    var hashListsByPageId = RDR.actions.hashNodes( $(this) );
                                    //we expect just the one here, so just get that one.
                                    var hash;
                                    $.each( hashListsByPageId, function(page_id, hashArray) {
                                        hash = hashArray[0];
                                    });
                                    if(!hash){
                                        //i think there should always be a hash though
                                        RDR.safeThrow('There should always be a hash from hashNodes after hover on an unhashed image.');
                                        return;
                                    }

                                    RDR.actions.sendHashes( hashListsByPageId, function(){
                                        if( $this.hasClass('rdr_live_hover') ){
                                            if ( !$('#rdr_indicator_details_'+hash).hasClass('rdr_engaged') ) {
                                                $('#rdr_indicator_' + hash).show();
                                            }
                                        }
                                    });
                                    //these calls are redundant to the same calls in the callback above,
                                    //but this will make them show up right away,
                                    //and then the ones in the callback will make sure they don't get lost when the indicator re-inits.
                                    // RDR.actions.indicators.utils.borderHilites.update(hash);
                                    // RDR.actions.indicators.utils.borderHilites.engage(hash);

                                } else {
                                    var hash = $this.data('hash');
                                    
                                    $this.addClass('rdr_live_hover');
                                    if ( !$('#rdr_indicator_details_'+hash).hasClass('rdr_engaged') ) {
                                        $('#rdr_indicator_' + hash).show();
                                        // RDR.actions.indicators.utils.borderHilites.engage(hash);
                                    }

                                    RDR.actions.content_nodes.init(hash, function(){});
                                }

                            }
                        })
                        .on( 'mouseleave', 'embed, video, object, iframe, img'+imgBlackListFilter, function(event){
                            var $this = $(this);
                                // hash = $this.data('hash');

                            // only fire the event if NOT in a known image container... otherwise we want the event to fire once, from the container
                            if ( !$this.parents( RDR.group.img_container_selectors ).length ) {
                                _mediaHoverOff( $this )
                            }
                    });
                }

                RDR.events.emit('readrboard.hashed_nodes', 'complete', { });
                
                function _mediaHoverOff( obj ) {
                    var $this = $(obj),
                        hash = $this.data('hash');

                    $this.removeClass('rdr_live_hover');
                    $('#rdr_indicator_' + hash).hide();
                }

            },
            initEnvironment: function(){
                //This should be the only thing appended to the host page's body.  Append everything else to this to keep things clean.
            
                var $rdrSandbox = $('<div id="rdr_sandbox" class="rdr rdr_sandbox"/>').appendTo('body');
                
                if(isTouchBrowser){
                    $('#rdr_sandbox').addClass('isTouchBrowser');
                }

                RDR.util.checkSessions();

                // get author, topics, tags from publisher-defined tags
                var page_attributes = ['topics', 'author', 'section'];
                $.each(page_attributes, function(idx, trait){
                    if ( RDR.group[trait+'_selector'] != 'undefined' && RDR.group[trait+'_attribute'] != 'undefined' && $( RDR.group[trait+'_selector'] ).length ){
                        RDR.group[trait] = '';
                        $(RDR.group[trait+'_selector']).each( function() {
                            RDR.group[trait] += $(this).attr(RDR.group[trait+'_attribute']) + ',';
                        });
                        RDR.group[trait] = RDR.group[trait].substr(0, RDR.group[trait].length-1);
                    }
                });

                // setup a scroll event detector
                /**/

                var active_section_offsets = $(RDR.group.active_sections+':eq(0)').offset();
                RDR.group.active_section_top = active_section_offsets.top;
                RDR.group.active_section_bottom = active_section_offsets.bottom;
                RDR.group.active_section_height = active_section_offsets.bottom - active_section_offsets.top;
                RDR.group.active_section_milestones = {
                    '0':RDR.group.active_section_top,
                    '20':((RDR.group.active_section_height/5)+RDR.group.active_section_top),
                    '40':((RDR.group.active_section_height/5*2)+RDR.group.active_section_top),
                    '60':((RDR.group.active_section_height/5*3)+RDR.group.active_section_top),
                    '80':((RDR.group.active_section_height/5*4)+RDR.group.active_section_top),
                    '100':RDR.group.active_section_bottom,
                    'fired':0
                    // 'fired_0':true,  // this should never fire
                    // 'fired_20':false,
                    // 'fired_40':false,
                    // 'fired_60':false,
                    // 'fired_80':false,
                    // 'fired_100':false
                };

        
                $(window).on('scroll.rdr', function() {
                    // disable scroll event tracking.
                    // clearTimeout($.data(this, 'rdr_scrollTimer'));
                    // $.data(this, 'rdr_scrollTimer', setTimeout(function() {

                    //     var scrolltop = $(window).scrollTop();
                    //     var windowHeight = $(window).height();

                    //     if ( RDR.group.active_section_milestones['fired'] < 100 && (scrolltop+windowHeight) > RDR.group.active_section_milestones['100'] ) { RDR.events.fireScrollEvent('100'); RDR.group.active_section_milestones['fired'] = 100; }
                    //     if ( RDR.group.active_section_milestones['fired'] < 80 && (scrolltop+windowHeight) > RDR.group.active_section_milestones['80'] ) { RDR.events.fireScrollEvent('80'); RDR.group.active_section_milestones['fired'] = 80; }
                    //     if ( RDR.group.active_section_milestones['fired'] < 40 && (scrolltop+windowHeight) > RDR.group.active_section_milestones['40'] ) { RDR.events.fireScrollEvent('40'); RDR.group.active_section_milestones['fired'] = 40; }
                    //     if ( RDR.group.active_section_milestones['fired'] < 60 && (scrolltop+windowHeight) > RDR.group.active_section_milestones['60'] ) { RDR.events.fireScrollEvent('60'); RDR.group.active_section_milestones['fired'] = 60; }
                    //     if ( RDR.group.active_section_milestones['fired'] < 20 && (scrolltop+windowHeight) > RDR.group.active_section_milestones['20'] ) { RDR.events.fireScrollEvent('20'); RDR.group.active_section_milestones['fired'] = 20; }
                    // }, 250));
                    
                    RDR.actions.initPageData();
                    // return RDR.util._.throttle(
                    //     RDR.actions.initPageData,
                    // 100
                    // );
                });

                var groupPageSelector = (RDR.group.summary_widget_selector) ? ', '+RDR.group.summary_widget_selector : '';
                RDR.events.recordEvents = $(".rdr-page-summary" + groupPageSelector).length;


                
                // this does not seem to work!
                // $(window).on('beforeunload.rdr',function(event) {
                    // RDR.events.trackEventToCloud({
                    //     event_type: 'page_exit',
                    //     event_value: '',
                    //     page_id: RDR.util.getPageProperty('id')
                    // });
                // });

                // ReadrBoard Timer?  unsure
                RDR.util.setWindowInterval();

                RDR.util.fixBodyBorderOffsetIssue();
                
                if(!!RDR.group.br_replace_scope_selector){
                  RDR.util.fixBrTags();
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
                    var currTop = parseInt( $rdrSandbox.css('top'), 10 );
                    var currLeft = parseInt( $rdrSandbox.css('left'), 10);

                    RDR.util.cssSuperImportant($rdrSandbox, {
                            left: (currLeft+bodyLeft) +'px',
                            top: (currTop+bodyTop)+'px'
                        }, true);

                    $rdrSandbox.append('<style>.rdr_twtooltip { margin-left:'+bodyLeft+'px !important; margin-top:'+bodyTop+'px !important; } </style>');



                //div to hold indicatorBodies for media (images and video)
                $('<div id="rdr_container_tracker_wrap" /><div id="rdr_indicator_details_wrapper" /><div id="rdr_event_pixels" />').appendTo($rdrSandbox);
          
                //div to hold indicators, filled with insertContainerIcon(), and then shown.
                // $('<div id="rdr_indicator_details_wrapper" />').appendTo($rdrSandbox);

                //div to hold event pixels
                // $('<div id="rdr_event_pixels" />').appendTo($rdrSandbox);

                $(document).on('mouseup.rdr', function(e){
                    //temp fix for bug where a click that clears a selection still picks up the selected text:
                    //Todo: This should work in the future as well, but I want to look into it further.
                    setTimeout(function(){
                        RDR.actions.startSelectFromMouseUp(e);
                    }, 1 );
                    //even 0 works, so I'm not worried about 1 being too low.
                    //besides, the fail scenerio here is very minor - just that the actionbar hangs out till you click again.
                });

                if ( !isTouchBrowser ) {
                    $(document).on('mousedown.rdr',function(event) {
                        var $mouse_target = $(event.target);

                        if ( ( $mouse_target.closest('.rdr_inline').length ) || (!$mouse_target.hasAttr('rdr-cta-for') && !$mouse_target.parents().hasClass('rdr') && !$('div.rdr-board-create-div').length) ) {
                            // if ( $('#rdr_loginPanel').length ) {
                            //     RDR.session.getUser(function() {
                            //         RDR.util.userLoginState();
                            //     });
                            // }
                            RDR.actions.UIClearState();

                            // if ( !isTouchBrowser ) {
                            $('div.rdr_indicator_details_for_media').each( function() {
                                RDR.actions.containers.media.onDisengage( $(this).data('container') );
                            });
                            // }
                        }

                    });
                } else {
                    $(document).on('touchend.rdr',function(e) {
                        if (RDR.util.bubblingEvents['dragging'] == true ) { return; }
                        if (RDR.util.bubblingEvents['touchend'] == false) {
                            var $mouse_target = $(e.target);

                            if ( ( $mouse_target.closest('.rdr_inline').length ) || (!$mouse_target.hasAttr('rdr-cta-for') && !$mouse_target.parents().hasClass('rdr') && !$('div.rdr-board-create-div').length) ) {
                                // if ( ($mouse_target.hasAttr('rdr-node') && $('.rdr_window').length>1) || ( !$mouse_target.hasAttr('rdr-node') && $('.rdr_window').length ) ) {

                                // the container.singletap will handle container state clearing.  (unless and img.)  sigh.
                                if ( !$mouse_target.hasAttr('rdr-node') || $mouse_target.get(0).nodeName.toLowerCase() == 'img' ) {
                                    RDR.actions.UIClearState();
                                }
                            }
                        }

                        RDR.util.bubblingEvents['touchend'] = false;
                    });

                    // iphone drag fix
                    $(document).on('touchmove.rdr',function(e) {
                        RDR.util.bubblingEvents['dragging'] = true;
                    });
                    $(document).on('touchstart.rdr',function(e) {
                        RDR.util.bubblingEvents['dragging'] = false;
                    });
                }

                //bind an escape keypress to clear it.
                $(document).on('keyup.rdr', function(event) {
                    if (event.keyCode == '27') { //esc
                        RDR.actions.UIClearState();
                    }
                });
                
                $(window).resize(RDR.util.throttledUpdateContainerTrackers());

                $RDR.dequeue('initAjax');
            },
            handleDeprecated: function() {
                //rdr-content-type ????  could be come rdr-content-attributes="question"
                // rewrite some deprecated ReadrBoard attributes into their newer versions
                $('[rdr-custom-display]').each( function() {
                    var $this = $(this);
                    $this.attr('rdr-item', $this.attr('rdr-custom-display') );
                    $this.removeAttr('rdr-custom-display');
                });

                $('[rdr-grid-for]').each( function() {
                    var $this = $(this);
                    $this.attr('rdr-view-reactions-for', $this.attr('rdr-grid-for') );
                    $this.removeAttr('rdr-grid-for');
                });
                $RDR.dequeue('initAjax');
            },
            initSeparateCtas: function(){
                // RDR.initSeparateCtas
                
                if (RDR.group.separate_cta) {
                    var separateCtaCount = 0;
                    $(RDR.group.active_sections).find(RDR.group.separate_cta).each( function(idx, node) {
                        var $node = $(node),
                            tagName = node.nodeName.toLowerCase(),
                            crossPage = '';

                        if ( $node.closest(RDR.group.no_readr).length ) {return;}
                        if ( $node.hasAttr('rdr-item') ) {
                            var rdrItem = $node.attr('rdr-item');
                        } else {
                            var rdrItem = 'rdr-custom-cta-'+separateCtaCount;
                            $node.attr('rdr-item', rdrItem);
                        }

                        // make all media a crosspage container?  
                        // nah.
                        // if ( tagName == 'img' || tagName == 'iframe' || tagName == 'embed' || tagName == 'video' || tagName == 'audio' ) {
                        //     $node.attr('rdr-crossPageContent', 'true');
                        // }

                        $node.after('<div class="rdr-custom-cta-container" rdr-tag-type="'+tagName+'"><div class="rdr-custom-cta" rdr-cta-for="'+rdrItem+'" rdr-mode="read write"><span class="no-rdr rdr-logo" title="This is <strong style=\'color:#4d92da;\'>ReadrBoard</strong>. Click to visit our site and learn more!" src="'+RDR_staticUrl+'widget/images/blank.png" ></span> <span rdr-counter-for="'+rdrItem+'"></span> <span rdr-reactions-label-for="'+rdrItem+'">Your Reaction?</span></div> </div>');
                        // $node.after('<div class="rdr-custom-cta-container"><div class="rdr-custom-cta rdr-write" rdr-cta-for="'+rdrItem+'" rdr-mode="write">Your Reaction?</div> <div class="rdr-custom-cta rdr-read" rdr-cta-for="'+rdrItem+'" rdr-mode="read"><span rdr-counter-for="'+rdrItem+'"></span> Reactions</div></div>');
                        separateCtaCount++;
                    });
                }

                $RDR.dequeue('initAjax');
            },
            initHTMLAttributes: function() {
                // grab rdr-items that have a set of rdr-reactions and add to window.readrboard_extend_per_container
                $('[rdr-reactions][rdr-item]').each( function () {
                    var $this = $(this),
                        itemName = $this.attr('rdr-item'),
                        reactions = $this.attr('rdr-reactions');

                    if ( reactions && typeof window.readrboard_extend_per_container[itemName] == 'undefined' ) {
                        var itemDefinition = {};
                        itemDefinition.default_reactions = [];

                        $.each(reactions.split(';'), function(idx, tag) {
                            itemDefinition.default_reactions.push( $.trim(tag) );
                        });

                        window.readrboard_extend_per_container[itemName] = itemDefinition;
                    }
                });

                $RDR.dequeue('initAjax');
            },
            reInit: function() {
                // RDR.actions.reInit:
                RDR.actions.hashCustomDisplayHashes();
            },
            UIClearState: function(e){
                // if (!isTouchBrowser) {
                    //RDR.actions.UIClearState:
                    // clear any errant tooltips
                    $('div.rdr_twtooltip').remove();

                    RDR.rindow.closeAll();
                    RDR.actionbar.closeAll();
                    RDR.actions.containers.media.disengageAll();
                    // RDR.actions.indicators.utils.borderHilites.disengageAll();
                    $('div.rdr.rdr_tag_details.rdr_sbRollover').remove();
                    
                    if (!isTouchBrowser) { 
                        $('div.rdr_indicator_for_media').hide();
                    }

                    $().selog('hilite', true, 'off');

                    //clear a share alert if it exists - do this better later.
                    var shareBoxExists = $('.rdr_fromShareLink').length;
                    if( shareBoxExists ){
                        RDR.session.alertBar.close( 'fromShareLink' );
                    }
                // } else {

                // }
            },
            catchRangyErrors: function(errorMsg){
                //RDR.actions.catchRangyErrors:

                //safe throw the errror.
                RDR.safeThrow(errorMsg);
            },
            hashNodes: function( $node, nomedia ) {
                //RDR.actions.hashNodes:

                // [porter]: needs a node or nodes
                if ( typeof $node==="undefined" ) { return; }

                //todo: consider how to do this whitelist, initialset stuff right
                var $allNodes = $(),
                nodeGroups = [
                    {
                        kind: 'media',
                        $group: null,
                        whiteList: RDR.group.media_selector,
                        filterParam: RDR.group.active_sections + ' embed, ' + RDR.group.active_sections + ' video, ' + RDR.group.active_sections + ' object, ' + RDR.group.active_sections + ' iframe',
                        setupFunc: function(){
                            var body = this.src;
                            $(this).data({
                                'body':body
                            });
                        }
                    },
                    {
                        kind: 'img',
                        $group: null,
                        whiteList: RDR.group.active_sections + ' img',
                        filterParam: 'img',
                        setupFunc: function(){
                            //var body = $(this).attr('src');
                            var body = this.src;
                            $(this).data({
                                'body':body
                            });
                        }
                    },
                    {
                        kind: 'text',
                        $group: null,
                        whiteList: RDR.group.active_sections_with_anno_whitelist,
                        filterParam: function(idx, node){
                            //todo: reconsider using this - it's not super efficient to grab the text just to verify it's a node that has text.
                            // - Prob fine though since we're only testing hashes we pass in manually.
                            //proves it has text (so ellminates images for example.) //the !! is just a convention indicating it's used as a bool.
                            var $node = $(node),
                                node_text = $node.text(),
                                node_parent_text = $node.parent().text();
                            if ( node_text != node_parent_text ) {
                                // bang bang:  http://stackoverflow.com/questions/784929/what-is-the-not-not-operator-in-javascript
                                return !!node_text;
                            }
                        },
                        setupFunc: function(){
                            var $this = $(this),
                                body = RDR.util.getCleanText($this);
                            $this.data('body',body);
                        }

                    },
                    {
                        kind: 'custom',
                        $group: null,
                        whiteList: '',
                        filterParam: function(idx, node){
                            // look for a rdr-src
                            var $node = $(this);

                            // bang bang:  http://stackoverflow.com/questions/784929/what-is-the-not-not-operator-in-javascript
                            return !!$node.hasAttr('rdr-src');
                        },
                        setupFunc: function(){
                            // set the rdr-src to the 'body'
                            var $node = $(this),
                                body = $node.attr('rdr-src');

                            $node.data({
                                'body':body
                            });
                        }

                    }
                ];

                //go through the groups in order and pick out valid nodes of that type. Default to text if it's valid for that.
                $.each( nodeGroups, function( idx, group ){

                    // take the $node passed in, add it to group via filters
                    var $group = $node.filter( group.filterParam );


                    // add vaild descendants of the $node
                    // PERFORMANCE ISSUE?
                    // LAYOUT INVALIDATED?
                    $group = $group.add( $node.find( group.whiteList ) );
                    
                    //trick for br_replace option.
                    //todo: prove that this approach works best across all sites and make it nicer.
                    if(!!RDR.group.br_replace_scope_selector && (group.kind == "text")){
                        $group = $group.add( $node.find( '.rdr_br_replaced' ) );
                    }

                    //take out prev categorized nodes (text is last, so we default to that)
                    $group = $group.not($allNodes);
                    
                    // hack to fix text nodes taking over our media
                    if(group.kind == "text"){
                        $group = $group.not(RDR.group.media_selector + ", " +RDR.group.img_selector);
                    }

                    //filter out blacklisted stuff and already hashed stuff
                    $group = $group.not('[rdr-hashed], .no-rdr, #rdr_sandbox');
                    group.$nodes = $group;

                    //setup the group as needed
                    $group.each( function(){
                        group.setupFunc.apply(this);
                        $(this).data('kind', group.kind);
                    });

                    $allNodes = $allNodes.add($group);
                    
                    //flag exceptions for inline_indicators
                    var $inlineMediaSet = $allNodes.filter(RDR.group.inline_selector);

                    $inlineMediaSet.each(function(){
                        $(this).data('inlineIndicator', true);
                    });

                });


                // TODO when would this do anything?
                // (eric) wow - I really can't figure out why this is here - I guess it's checking to see if everything is blank, but that's weird.
                            // I guess we can take it out if you didn't want it here either.
                if( !$allNodes.data('body') ) { return false; }
                //else
                var hashList = {};

                //run init outside the loop for optimization to avoid many reflows
                var indicatorInitQueue = [];

                $allNodes.each(function(){
                    var $this = $(this),
                        body = $this.data('body'),
                        kind = $this.data('kind'),
                        HTMLkind = $this.get(0).nodeName.toLowerCase(),
                        hashBody = body,
                        hash,
                        oldHash,
                        hashText;

                    if ( $this.closest('.no-rdr').length ) {
                        return;
                    }
                    
                    if ( (kind == "img" || kind == "media") && body ) {

                        // band-aid for old image hashing technique.  bandaid.  remove, hopefully.
                        hashText = "rdr-"+kind+"-"+hashBody; //examples: "rdr-img-http://dailycandy.com/images/dailycandy-header-home-garden.png" || "rdr-p-ohshit this is some crazy text up in this paragraph"
                        oldHash = RDR.util.md5.hex_md5( hashText );
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
                                RDR.group.media_url_ignore_query = false;   
                            }

                        });
                        if ( RDR.group.media_url_ignore_query && hashBody.indexOf('?') ){
                            hashBody = hashBody.split('?')[0];
                        }

                        // if this got 'rdr-oldhash' class down in the /api/summary/containers/ call, then use that hash, don't regenerate it
                        if ( $this.hasAttr('rdr-oldhash') ) {
                            hash = $this.data('hash');
                        } else {
                        //it didn't have oldhash, so it's an image no one has reacted to yet
                            hashText = "rdr-"+kind+"-"+hashBody;
                            hash = RDR.util.md5.hex_md5( hashText );

                        }

                    } else {
                        if(!body){
                          return;
                        }

                        hashText = "rdr-"+kind+"-"+body;
                        hash = RDR.util.md5.hex_md5( hashText );

                        if ( !$this.hasAttr('rdr-hash') )  {

                            var iteration = 1;
                            while ( typeof RDR.summaries[hash] != 'undefined' ) {
                                hashText = "rdr-"+kind+"-"+body+"-"+iteration;
                                hash = RDR.util.md5.hex_md5( hashText );
                                iteration++;
                            }
                        }

                    }

                    // prevent the identical nested elements being double-hashed bug
                    // like <blockquote><p>Some quote here</p></blockquote>
                    // we want the deepest-nested block element to get the hash, so the indicator appears next to the text
                    // if ( $this.parents('[rdr-hash="'+hash+'"]').length ) {
                    //     var $parentNodes = $this.parents('[rdr-hash="'+hash+'"]');
                    //     RDR.actions.stripRdrNode($parentNodes);
                    // }
                    
                    // we will use this in the following conditionals
                    var thisTagName = $this.get(0).nodeName.toLowerCase();

                    // check to see if this is an IMG inside a hashed node.  if so, check this thing for siblings.
                    // if no siblings... make sure the parent does not have a hash or they may be identical
                    // both HTML and text.
                    // update 7/2014:  stunningly, this applies to body tag, and apparently, we want that.
                    if ( thisTagName == 'img' ) { 
                        if ( $this.parents('[rdr-hash]').length && !$this.siblings(RDR.group.anno_whitelist).length ) {
                            var $parentNodes = $this.parents('[rdr-hash]');
                            RDR.actions.stripRdrNode($parentNodes);
                        }
                    }

                    // prevent two indicators for content when there are nested block elements
                    // only hash and insert an indicator for the deepest node
                    // to begin, check the node we are hasing (hashNode) for any nested elements from the Allowed Tags (anno_whitelist) setting
                    if ( $this.find(RDR.group.anno_whitelist).length ) {
                        var dontHash = false;

                        // loop through the Allowed Tags that are nested inside the hashNode
                        $this.find(RDR.group.anno_whitelist).each(function(idx, childNode) {


                            var tagName = childNode.nodeName.toLowerCase(),
                                embedTagsArray = ['img','iframe','embed'];

                            // if this node, inside the hashNode, is an image, iframe, or embed...
                            // check to see if ti has any valid siblings (in case, say, the image is floated next to a paragraph)
                            if ( $.inArray(tagName, embedTagsArray) != -1 ) {

                                var $childNode = $(childNode);
                                if ($childNode.siblings(RDR.group.anno_whitelist).length ) {
                                    
                                }

                            } else {
                                dontHash = true;
                            }
                        });

                        if (dontHash===true) { 
                            // RDR.actions.stripRdrNode($this);
                            return;
                        }
                    }

                    // add an object with the text and hash to the RDR.containers dictionary
                    //todo: consider putting this info directly onto the DOM node data object
                    RDR.actions.containers.save({
                        body:body,
                        kind:kind,
                        hash:hash,
                        HTMLkind:HTMLkind,
                        $this: $this
                    });

                    // add a CSS class to the node that will look something like "rdr-207c611a9f947ef779501580c7349d62"
                    // this makes it easy to find on the page later

                    //don't do this here - do it on success of callback from server
                    // [ porter ]  DO do it here, need it for sendHashes, which needs to know what page it is on, and this is used to find out.
                    $this.attr( 'rdr-hash', hash ).attr('rdr-node', 'true');

                    // if ( HTMLkind != 'body' && !isTouchBrowser) {
                    if ( HTMLkind != 'body' && !isTouchBrowser ) {
                        // // todo: touchHover
                        
                        $this.on('mouseenter', function() {
                            RDR.actions.indicators.init(hash);
                            $(this).addClass('rdr_live_hover');
                        })//chain
                        .on('mouseleave', function() {
                            // var $hash_helper = $('.rdr_helper_rindow.rdr_for_'+hash);
                            // if ( $hash_helper.length ) {
                            //     $hash_helper.remove();
                            // }
                            $(this).removeClass('rdr_live_hover');
                        });

                    }

                    var summary = RDR.actions.summaries.init(hash);
                    RDR.actions.summaries.save(summary);

                    // indicatorInitQueue.push(hash);

                    var page_id = RDR.util.getPageProperty('id', hash );
                    if ( !hashList[ page_id ] ) hashList[ page_id ] = [];

                    hashList[ page_id ].push(hash);
                    $this.data('hash', hash); //todo: consolidate this with the RDR.containers object.  We only need one or the other.

                });
    
                // perfimprove
                // $.each(indicatorInitQueue, function(idx, hash){
                //     RDR.actions.indicators.init(hash);
                // });

                return hashList;
            },
            sendHashes: function( hashesByPageId, onSuccessCallback ) {
                // RDR.actions.sendHashes:

                var hashList = [];
                $.each(hashesByPageId, function(pageId, hashList){
                    
                    //might not need to protect against this anymore.
                    if(!pageId || typeof hashList != "object" ){
                        //im guessing this will never happen - test for a while and elliminate.
                        RDR.safeThrow("No more messy hashes allowed!!");
                        return;
                    }

                    var $pageContainer = $('[rdr-page-container="'+pageId+'"]');

                    $.each( $pageContainer.find('[rdr-item]'), function( idx, node ) {
                        var $node = $(node);

                        if ( typeof $node.data('rdr-hashed') == "undefined" ) {
                            var thisHash = $node.attr('rdr-hash');

                            hashList = $.grep(hashList, function(value) {
                              return value != thisHash;
                            });

                            if (typeof thisHash != 'undefined') {
                                hashList.push( thisHash );
                            }

                            //init the cross page containers so even the ones that come back with 0 reactions will
                            //have write mode enabled
                            RDR.actions.indicators.init(thisHash);
                            $node.data('rdr-hashed', true);
                            // $node.data('rdr-hashed-one', true); // on load.  for debug only.
                        }
                    });

                    $.each(hashList, function(idx, hash){

                        //might not need to protect against this anymore.
                        if (typeof hash != "string" ){
                            RDR.safeThrow("why is your hash not a string!?");
                            return;
                        }

                        var $hashable_node = $pageContainer.find('[rdr-hash="' + hash +'"]');

                        if ($hashable_node.length == 1 ) {
                            $hashable_node.attr('rdr-hashed', true);
                            // $hashable_node.attr('rdr-hashed-two', true); // on select.  for debug only.
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
                        RDR.safeThrow("why is the pageID NAN ??: "+ pageId + "-->" + pageIdToInt);
                    }

                    // get crossPage containers (which may/may not also be custom display)
                    // they need to be initialized by this point (rdr-hashed)
                    var crossPageHashes = [];
                    $.each( $('[rdr-crossPageContent="true"]'), function( idx, node ) {
                        var thisHash = $(node).attr('rdr-hash');
                        crossPageHashes.push( thisHash );

                        hashList = $.grep(hashList, function(value) {
                          return value != thisHash;
                        });

                        //init the cross page containers so even the ones that come back with 0 reactions will
                        //have write mode enabled
                        RDR.actions.indicators.init(thisHash);
                    });

                    // debug:
                    // var crossPageHashes = ["fcd4547dcaf3699886587ab47cb2ab5e"];

                    RDR.actions.sendHashesForSinglePage({
                       short_name : RDR.group.short_name,
                       pageID: pageIdToInt,
                       hashes: hashList,
                       crossPageHashes:crossPageHashes
                    }, onSuccessCallback);
                
                });
            },
            sendHashesForSinglePage: function(sendData, onSuccessCallback){
                // RDR.actions.sendHashesForSinglePage:

                    var pageId = sendData.pageID;

                    // send the data!
                    $.ajax({
                        url: RDR_baseUrl+"/api/summary/containers/",
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
                                    RDR.known_hashes = response.data.known;
                                }

                                // add the cross-page hashes to the known_hashes obj so that its reaction info gets inserted!
                                if ( typeof response.data.crossPageKnown != "undefined" ) {
                                    if (typeof response.data.known != "undefined" ) {
                                        RDR.known_hashes = $.extend( RDR.known_hashes, response.data.crossPageKnown );
                                    }
                                    RDR.crosspage_hashes = response.data.crossPageKnown;
                                }

                                // if a crosspage container has no reactions, it isn't returned in the "crossPageKnown" object
                                // but we still want to do an init of the node... so we make dummy objects
                                // this is so we can init the nodes down below when we call
                                // RDR.actions.containers.initCustomDisplayHashes(response.data.crossPageKnown);
                                $.each( $('[rdr-crossPageContent="true"]'), function( idx, node ) {
                                    var thisHash = $(node).attr('rdr-hash');
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
                                    if (typeof RDR.crosspage_hashes != "undefined" ) {
                                        RDR.crosspage_hashes = {};
                                    }
                                    RDR.crosspage_hashes[thisHash] = dummySummaryObject;
                                });

                                var summaries = {};
                                summaries[ pageId ] = response.data.known;
                                
                                $.each(response.data.unknown, function(idx, hash){
                                    if (typeof hash != "string") {
                                        RDR.safeThrow('why would this not be a string?');
                                        return;
                                    }

                                    var unknown_summary;
                                    // get the kind
                                    var $node = $('[rdr-hash="'+hash+'"]');
                                    var kind = $node.data('kind');
                                    if(!kind){
                                        RDR.safeThrow('node should always have data: kind');
                                    }
                                    unknown_summary = RDR.util.makeEmptySummary( hash, kind );

                                    summaries[ pageId ][ hash ] = unknown_summary;
                                });

                                // [ porter ]: since we're not storing containers anymore, just setup all hashes regardless of "known" status
                                if ( !$.isEmptyObject(summaries) ){
                                    //setup the summaries
                                    RDR.actions.containers.setup(summaries);

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
                                $.each( $('[rdr-item]') , function(idx, node) {
                                    if ( initSomeHashes.indexOf($(node).data('hash')) == -1 ) {
                                        initSomeHashes.push( $(node).data('hash') );
                                    }
                                });

                                RDR.actions.containers.initCustomDisplayHashes( initSomeHashes );
                            }
                        }
                    });

                
            },
            hashCustomDisplayHashes: function() {
                // RDR.actions.hashCustomDisplayHashes:

                var pageCustomDisplays = {},
                    pageId = RDR.util.getPageProperty();
                
                pageCustomDisplays[ pageId ] = [];
                
                if ( $('[rdr-item]').length ) {

                    // should we find custom-display nodes and add to the hashList here?
                    $.each( $('[rdr-item]'), function( idx, node ) {
                        var $node = $(node);
                        RDR.actions.hashNodes( $node );
                        var thisHash = $node.attr('rdr-hash');

                        pageCustomDisplays[ pageId ].push( thisHash );

                        RDR.actions.indicators.init( thisHash );
                    });

                }

                RDR.actions.sendHashes( pageCustomDisplays );
            },
            comments: {
                makeCommentBox: function(settings, options){
                    // RDR.actions.comments.makeCommentBox
                    var content_node = settings.content_node,
                        tag = settings.tag,
                        summary = settings.summary,
                        hash = settings.hash,
                        kind = settings.kind,
                        $rindow = settings.$rindow,
                        selState = settings.selState;

                    options = options || {};

                    var helpText = options.helpText || "Add comments or #hashtags";
                    
                    //not used any more
                    var cta = options.cta || "Leave a comment";

                    var $commentBox = $('<div class="rdr_commentBox rdr_clearfix"></div>');

                    //todo: combine this with the other make comments code
                    var $commentDiv =  $('<div class="rdr_comment">'),
                        $commentTextarea = $('<textarea class="rdr_default_msg">' +helpText+ '</textarea>'),
                        $rdr_charCount =  $('<div class="rdr_charCount">'+RDR.group.comment_length+' characters left</div>'),
                        $submitButton =  $('<button class="rdr_commentSubmit">Comment</button>');

                    $commentDiv.append( $commentTextarea, $rdr_charCount, $submitButton );

                    $commentTextarea.focus(function(){
                        // RDR.events.track('start_comment_lg::'+content_node.id+'|'+tag.id);
                        $(this).removeClass('rdr_default_msg');
                        if( $(this).val() == helpText ){
                            $(this).val('');
                        }
                    }).blur(function(){
                        var val = $(this).val();
                        if( val === "" || val === helpText ){
                            $(this).addClass('rdr_default_msg');
                            $(this).val( helpText );
                        }
                    }).keyup(function(event) {
                        var commentText = $commentTextarea.val();
                        if (event.keyCode == '27') { //esc
                            $(this).blur();
                            // return false so the rindow doesn't close.
                            return false;
                        } else if ( commentText.length > RDR.group.comment_length ) {
                            commentText = commentText.substr(0, RDR.group.comment_length);
                            $commentTextarea.val( commentText );
                        }
                        $commentTextarea.siblings('div.rdr_charCount').text( ( RDR.group.comment_length - commentText.length ) + " characters left" );
                    });

                    $submitButton.click(function(e) {
                        //add what we need to settings:
                        $.extend(settings, {
                            $commentTextarea: $commentTextarea,
                            helpText: helpText
                        });

                        RDR.actions.comments.submitComment(settings);
                    });

                    $commentBox.append( $commentDiv );
                    return $commentBox;
                
                },
                submitComment: function(settings){
                    // RDR.actions.comments.submitComment
                    var $commentTextarea = settings.$commentTextarea,
                        helpText = settings.helpText,
                        content_node = settings.content_node,
                        summary = settings.summary,
                        kind= settings.kind,
                        hash = settings.hash,
                        tag  = settings.tag ,
                        $rindow = settings.$rindow,
                        selState = settings.selState;

                    var commentText = $commentTextarea.val();

                    //keyup doesn't guarentee this, so check again (they could paste in for example);
                    if ( commentText.length > RDR.group.comment_length ) {
                        commentText = commentText.substr(0, RDR.group.comment_length);
                        $commentTextarea.val( commentText );
                        $commentTextarea.siblings('div.rdr_charCount').text( ( RDR.group.comment_length - commentText.length ) + " characters left" );
                    }

                    if ( commentText != helpText ) {
                        //temp translations..
                        //quick fix.  images don't get the data all passed through to here correctly.
                        //could try to really fix, but hey.  we're rewriting soon, so using this hack for now.
                        if ($.isEmptyObject(content_node) && summary.kind=="img") {
                            content_node = {
                                "body":$('img.rdr-'+summary.hash).get(0).src,
                                "kind":summary.kind,
                                "hash":summary.hash
                            };

                        }
                        var args = {  hash:hash, content_node_data:content_node, comment:commentText, content:content_node.body, tag:tag, rindow:$rindow, selState:selState};

                        //leave parent_id undefined for now - backend will find it.
                        RDR.actions.interactions.ajax( args, 'comment', 'create');

                    } else {
                        $commentTextarea.focus();
                    }
                    return false; //so the page won't reload
                }
            },
            containers: {
                updateCrossPageHash: function(hash){
                    //RDR.actions.containers.updateCrossPageHash:
                    var isCrossPageContainer = $('[rdr-hash="'+hash+'"]').length > 0;
                    if(!isCrossPageContainer){
                        return;
                    }

                    //changing this to copy out and just call only parts of the initCrossPageHashes call below
                    RDR.actions.indicators.init(hash);

                    var $container = $('[rdr-hash="'+hash+'"]'),
                        customDisplayName = $container.attr('rdr-item'),
                        $grid = $('[rdr-view-reactions-for="'+customDisplayName+'"]');

                    if ($grid.length) {
                        RDR.actions.content_nodes.init(hash, function() {
                            RDR.actions.indicators.utils.makeTagsListForInline( $grid, false );
                            $grid.jScrollPane({ showArrows:true });
                        });
                    }
                },
                initCustomDisplayHashes: function(hashesToInit){

                    // go ahead and initialize the content nodes for custom display elements
                    // we might want to do this different with an HTML attribute, or something.  
                    // basically, this has to be done if the REACTION-VIEW (formerly: tag grid) is open on load.

                    $.each( hashesToInit, function(idx, hash) {
                        var $node = $('[rdr-hash="'+hash+'"]');

                        // var hash = hashObject.hash;
                        if (typeof hash != "undefined" && typeof $node.attr('rdr_summary_loaded') == "undefined" ) {
                            RDR.actions.indicators.init(hash);
                            RDR.summaries[hash].crossPage=true;

                            // init a reaction-view for an open custom display thing.
                            // i know, this should be abstracted.  it's too ProPublica specific.  
                            // needs abstraction, and conditionals to determine what to do based on the display properties.
                            var $container = $('[rdr-hash="'+hash+'"]'),
                                customDisplayName = $container.attr('rdr-item'),
                                // $indicator = summary.$indicator = $container, // might work?  $indicator is storing important data...
                                // $counter = $('[rdr-counter-for="'+customDisplayName+'"]'),
                                $reactionView = $('[rdr-view-reactions-for="'+customDisplayName+'"]'),
                                reactionViewStyle = $reactionView.attr('rdr-view-style') || 'grid',
                                reactionViewWidth = $reactionView.width(),
                                reactionViewHeight = $reactionView.height();

                            $reactionView.data('hash', hash).data('container', hash).addClass('no-rdr');

                            if ( reactionViewStyle == "grid" ) {

                                // if the reactionView grid has no height specified, give it one
                                // [pb, 9/12/13]:  think the 200px minimum is to make it look ok.  nt sure if it BREAKS if it's smaller than that or not.
                                if ( reactionViewHeight < 200 ) { reactionViewHeight = 200; $reactionView.height(reactionViewHeight); }

                                RDR.util.cssSuperImportant( $reactionView, { height:reactionViewHeight+"px" });

                                if ($reactionView.length) {
                                    // since currently, our reactionView needs to have a width that's a factor of 160... force that:
                                    var statedWidthDividedBy160 = parseInt( reactionViewWidth / 160 );
                                    
                                    reactionViewWidth = statedWidthDividedBy160 * 160;
                                    if ( reactionViewWidth > 960 ) { reactionViewWidth=960; }

                                    // RDR.util.cssSuperImportant( $reactionView, { width:reactionViewWidth+"px" });
                                    if ( !$reactionView.closest('.rdr_reactionView_wrapper').length ) {
                                        $reactionView.wrap('<div class="rdr_reactionView_wrapper" style="width:'+reactionViewWidth+'px;height:'+reactionViewHeight+'px;"></div>')
                                    }

                                    // can the header stuff be optional?
                                    $reactionView.addClass('w'+reactionViewWidth).html('<div class="rdr rdr_window rdr_inline w'+reactionViewWidth+' rdr_no_clear" style="position:relative !important;"><div class="rdr rdr_header"><div class="rdr_header_arrow"><img src="'+RDR_staticUrl+'widget/images/header_up_arrow.png"></div><div class="rdr_loader"></div><div class="rdr_about"><a href="http://www.readrboard.com/" target="_blank">&nbsp;</a></div><div class="rdr_indicator_stats"><img class="no-rdr rdr_pin" src="'+RDR_staticUrl+'widget/images/blank.png"><span class="rdr_count"></span></div><h1>Reactions</h1></div><div class="rdr rdr_body_wrap rdr_grid rdr_clearfix"></div></div>');
                                    RDR.actions.content_nodes.init(hash, function() { RDR.actions.indicators.utils.makeTagsListForInline( $reactionView, false ); $reactionView.jScrollPane({ showArrows:true }); } );
                                } else {
                                    RDR.actions.content_nodes.init(hash);
                                }
                            } else if ( reactionViewStyle == "horizontal_bars" ) {
                                $reactionView.html('<div class="rdr rdr_inline rdr_body_wrap rdr_horizontal_bars rdr_clearfix"></div>'); // gotta insert the rdr_body_wrap or there is no container to attach to in makeTagsListForInline 
                                RDR.actions.content_nodes.init(hash, function() { RDR.actions.indicators.utils.makeTagsListForInline( $reactionView, false ); } );
                            }
                        }
                    });
                },
                media: {
                    //RDR.actions.containers.media:
                    //actions for the special cases of media containers
                    onEngage: function(hash){
                        // deprecated?
                        return;
                        //RDR.actions.containers.media.onEngage:
                        // action to be run when media container is engaged - typically with a click on the indicator

                        // var $this = $('img[rdr-hash="'+hash+'"], iframe[rdr-hash="'+hash+'"],embed[rdr-hash="'+hash+'"],video[rdr-hash="'+hash+'"],object[rdr-hash="'+hash+'"]').eq(0),
                        //     $indicator = $('#rdr_indicator_'+hash),
                        //     $indicator_details = $('#rdr_indicator_details_'+hash);

                        // var hasBeenHashed = $this.hasAttr('rdr-hashed'),
                        //     isBlacklisted = $this.closest('.rdr, .no-rdr').length;

                        // var containerInfo = RDR.containers[hash];
                        // if ( containerInfo ) {
                        //     var $mediaItem = containerInfo.$this;

                        //     $mediaItem.data('hover',true).data('hash', hash);
                        //     RDR.actions.indicators.utils.updateContainerTracker(hash);
                        //     RDR.rindow.mediaRindowShow( $mediaItem );
                        //     // $indicator_details.addClass('rdr_has_border');
                        // }

                        // deprecated - see above
                        // RDR.events.track( 'view_node::'+hash, hash );
                    },
                    onDisengage: function(hash){
                        // deprecated?
                        return;

                        //RDR.actions.containers.media.onDisengage:
                        //actions to be run when media container is disengaged - typically with a hover off of the container
                        // var $mediaItem = $('img[rdr-hash="'+hash+'"], iframe[rdr-hash="'+hash+'"],embed[rdr-hash="'+hash+'"],video[rdr-hash="'+hash+'"],object[rdr-hash="'+hash+'"]').eq(0),
                        //     $indicator = $('#rdr_indicator_'+hash),
                        //     $indicator_details = $('#rdr_indicator_details_'+hash);

                        // var timeoutCloseEvt = $mediaItem.data('timeoutCloseEvt_'+hash);
                        // clearTimeout(timeoutCloseEvt);

                        // timeoutCloseEvt = setTimeout(function(){
                        //     var containerInfo = RDR.containers[hash];
                        //     if ( containerInfo ) {
                        //         $mediaItem.data('hover',false).data('hash', hash);
                        //         RDR.rindow.mediaRindowHide( $mediaItem );
                        //     }
                        // },100);
                        // $mediaItem.data('timeoutCloseEvt_'+hash, timeoutCloseEvt);
                    },
                    disengageAll: function(){
                        //RDR.actions.containers.media.disengageAll:

                        //only need to run this for containers that are active
                        var hashes = [];
                        $('.rdr_live_hover').each(function(){
                            var hash = $(this).data('hash');
                            hashes.push(hash);
                            RDR.actions.containers.media.onDisengage(hash);
                        });
                    }
                },
                save: function(settings){
                    //RDR.actions.containers.save:
                    //makes a new one or returns existing one
                    //expects settings with body, kind, and hash.
                    if( RDR.containers.hasOwnProperty(settings.hash) ) return RDR.containers[settings.hash];
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
                    RDR.containers[settings.hash] = container;
                    return container;
                },
                setup: function(summariesPerPage){
                    //RDR.actions.containers.setup:
                    //then define type-specific setup functions and run them
                    var _setupFuncs = {
                        img: function(hash, summary){

                            var containerInfo = RDR.containers[hash];
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

                            RDR.content_nodes[hash] = content_node_data;
                            RDR.rindow.update(hash);

                            //#touchBrowserMediaInit
                            if(isTouchBrowser){
                                RDR.actions.content_nodes.init(hash, function(){});
                                RDR.actions.indicators.init(hash);
                            }
                        },
                        media: function(hash, summary){
                            //for now, just pass through to img.
                            this.img(hash, summary);
                        },
                        text: function(hash, summary){
                            if(isTouchBrowser){
                                RDR.actions.content_nodes.init(hash, function(){});
                                RDR.actions.indicators.init(hash);
                            }
                        },
                        custom: function(hash, summary){

                        }
                    };

                    //todo: what does this do?  break this out into a function with a descriptive name.
                    var hashesToShow = []; //filled below

                    $.each(summariesPerPage, function(page_id, summariesByHash){
                        
                        if ( !summariesByHash || $.isArray(summariesByHash) ){
                            RDR.safeThrow('For godsake no. This should not be an array of hashes and it should not be the bastard cruft of some frankenpage object.');
                            return;
                        }

                        $.each(summariesByHash, function(hash, summary){
                            
                            //first do generic stuff
                            //save the hash as a summary attr for convenience.
                            summary.hash = hash;

                            var containerInfo = RDR.containers[hash];

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
                                RDR.actions.summaries.save(summary);

                                var pageContainerExists = false;

                                $.each( RDR.pages[ page_id ].containers, function(idx, definedPageContainer) {
                                    if ( definedPageContainer.hash == hash ) { pageContainerExists = true; }
                                });
                                if ( pageContainerExists == false ) {
                                    RDR.pages[ page_id ].containers.push({ "hash":hash, "id":summary.id });
                                } else {
                                }

                                // RDR.actions.indicators.update( hash, true);


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
                    RDR.actions.summaries.sortPopularTextContainers();
                    RDR.actions.summaries.displayPopularIndicators();

                    $.each( RDR.known_hashes, function(returnedHash, obj) {
                        // band-aid.  bandaid.
                        // we're going to iterate through images to see if there is an old hash
                        var $hash_is_an_img = $('img[rdr-node="returnedHash"]');
                        if ( $hash_is_an_img.length ) {
                            if ( $hash_is_an_img.data('oldHash') == returnedHash ) {
                                // remove the class with the 'new' hash, add a class with the 'old' hash, and set the current hash to the 'old' one
                                $hash_is_an_img.attr('rdr-hash', returnedHash).attr('rdr-oldhash','true').data('hash', returnedHash);
                            }
                        }

                        // now init the indicators
                        RDR.actions.indicators.init(returnedHash);
                    });

                    RDR.actions.indicators.show(hashesToShow);
                },
                send: function(hashList, onSuccessCallback){
                    //RDR.actions.containers.send:
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
                        var container = RDR.containers[hash];

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
                                RDR.actions.containers._ajaxSend(sendContainer);
                            });
                            */

                            //signals the call to not save this container
                            sendContainer = false;
                        }
                        else{
                            proposedLen += thisLen;
                            if(proposedLen > charLimit){
                                //send the existing set that is curLen, not proposedLen

                                RDR.actions.containers._ajaxSend(containers);
                                resetChunks();
                            }
                            containers[hash] = sendContainer;
                            curLen += thisLen;

                        }

                    });
                    //do one last send.  Often this will be the only send.
                    if( ! $.isEmptyObject(containers) ) {
                        RDR.actions.containers._ajaxSend(containers, onSuccessCallback);
                    }

                    //helper functions
                    function resetChunks(){
                        containers = {};
                        curLen = 0;
                        proposedLen = 0;
                    }
                },
                _ajaxSend: function(containers, onSuccessCallback){
                    //RDR.actions.containers._ajaxSend:
                    //this is a helper for this.send:
                    //don't call this directly! Always use this.send so you don't choke on your ajax.

                    var sendData = containers;

                    // TODO do we even need this anymore?
                    $.ajax({
                        url: RDR_baseUrl+"/api/containers/create/",
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
                                var node = RDR.containers[hash];
                                node.id = id;
                                dummySummaries[hash] = RDR.actions.summaries.init(hash);
                            });

                            RDR.actions.containers.setup(dummySummaries);

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
                    //RDR.actions.content_nodes.make:

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

                    if( RDR.content_nodes.hasOwnProperty(content_node_key) ) return RDR.content_nodes[content_node_key];
                    //else
                    var content_node = {
                        'container': settings.container,
                        'body': settings.body,
                        'location': settings.location,
                        'hash': hash
                    };

                    RDR.content_nodes[content_node_key] = content_node;

                    return content_node;
                },
                quickFixReset: function(hash){
                    //RDR.actions.content_nodes.quickFixReset;

                    //A quick hack to re-make the server call to update the comment count.  
                    //It's silly to make a server call to do this, but we need it to just work for now.
                    var summary = RDR.summaries[hash],
                        container_id = (typeof summary != "undefined") ? summary.id:"";
                    
                    if(container_id){
                        //clear the assetLoader flag which normally prevents it from loading twice.
                        delete RDR.assetLoaders.content_nodes[container_id];
                        RDR.actions.content_nodes.init(hash);
                    }
                    
                },
                init: function(hash, onSuccessCallback){
                    //RDR.actions.content_nodes.init:

                    // if ( $('.rdr-'+hash).hasClass('rdr_summary_loaded') ) {
                    //     return;
                    // }

                    // po' man's throttling
                    // if ( typeof RDR.inProgress === "undefined" ) { RDR.inProgress = []; }
                    // if ( $.inArray( hash, RDR.inProgress) != -1 ) {
                    //     return false;
                    // } else {
                    //     RDR.inProgress.push( hash );
                    // }

                    //gets this summary's content_nodes from the server and populates the summary with them.
                    var summary = RDR.summaries[hash],
                        container_id = (typeof summary != "undefined") ? summary.id:"";

                    if(!container_id){
                        //this still happens if container is an unknown container and has no reactions.
                        //It's save to just return for now though.
                        
                        // RDR.safeThrow('container_id is not valid for hash: '+hash);
                    
                        return;
                    }

                    var pageId = RDR.util.getPageProperty('id', hash);

                    //quick fix add pageId to summary becuase we need it in the summary widget content lookup
                    // todo: #summaryContentByPageFix
                    summary.pageId = pageId;

                    var sendData = {
                        "page_id" : pageId,
                        "container_id":container_id,
                        "hash":hash,
                        "cross_page": ( summary.$container.hasAttr('rdr-crossPageContent') ) ? true:false
                    };

                    //use an assetLoader that returns a deferred to ensure it gets loaded only once
                    //and callbacks will run on success - or immediately if it has already returned.
                    var assetLoader = RDR.assetLoaders.content_nodes[container_id];

                    if(!assetLoader){
                        assetLoader = $.ajax({
                            url: RDR_baseUrl+"/api/summary/container/content/",
                            type: "get",
                            contentType: "application/json",
                            dataType: "jsonp",
                            data: { json: $.toJSON(sendData) }
                        });

                        RDR.assetLoaders.content_nodes[container_id] = assetLoader;
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

                            var $container = $('[rdr-hash="'+hash+'"]');

                            try{
                                node.selState = $container.selog('save', { 'serialRange': node.location });
                            }
                            catch(err){
                                node.selState = undefined;
                            }

                        });

                        //throw the content_nodes into the container summary

                        RDR.content_nodes[hash] = content_nodes;
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
                        $('[rdr-hash="'+hash+'"]').attr('rdr_summary_loaded', 'true');

                        // fix for rdr-item not initted on pageload on a blogroll.  band-aid.  wtf.  ugh.
                        RDR.actions.indicators.update(hash);

                        // remove from po' man's throttling array
                        // po' man's throttling
                        // RDR.inProgress.splice( RDR.inProgress.indexOf( hash ) ,1);
                        // var y = [1, 2, 3]
                        // var removeItem = 2;

                        // if ( typeof RDR.inProgress === "undefined" ) { RDR.inProgress = []; }
                        // RDR.inProgress = $.grep(RDR.inProgress, function(value) {
                        //   return value != hash;
                        // });


                        //finally, run the success callback function
                        if ( onSuccessCallback ) {
                            onSuccessCallback();
                        }

                        //also run any callbacks that get queued up on the summarybar hover
                        if(RDR.contentNodeQueue && RDR.contentNodeQueue[hash] && RDR.contentNodeQueue[hash].length ){
                            $.each(RDR.contentNodeQueue[hash], function(){
                                var func = RDR.contentNodeQueue[hash].pop();
                                func(hash);
                            });
                        }
                    });

                },
                utils: {
                    getMediaDims: function($mediaNode){
                        //RDR.actions.content_nodes.utils.getMediaDims:

                        var h = $mediaNode.height();
                        var w = $mediaNode.width();

                        return ( !h || !w ) ? {} : {
                            height: h,
                            width: w
                        };
                    },
                    makeDictSortedByTag: function(content_nodes){
                        //RDR.actions.content_nodes.utils.makeDictSortedByTag:

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

                        //RDR.actions.content_nodes.utils.initHiliteStates:

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
                }//end RDR.actions.content_nodes.utils
            },
            interactions: {
                //RDR.actions.interactions:
                ajax: function(args, int_type, action_type){
                    //RDR.actions.interactions.ajax:
                    //temp tie-over
                    var hash = args.hash,
                        summary = RDR.summaries[hash],
                        kind = (summary) ? summary.kind:"";


                    if ( !action_type ) action_type = "create";

                    if( !RDR.actions.interactions.hasOwnProperty(int_type) ){
                        return false; //don't continue
                    }

                    // porter cross-page handler
                    var crossPageSendData = {};

                    // take care of pre-ajax stuff, mostly UI stuff
                    RDR.actions.interactions[int_type].preAjax(args, action_type);
                    //get user and only procceed on success of that.

                    RDR.session.getUser( args, function(newArgs){
                        var defaultSendData = RDR.actions.interactions.defaultSendData(newArgs),
                            customSendData = RDR.actions.interactions[int_type].customSendData(newArgs),
                            sendData = $.extend( {}, defaultSendData, customSendData, crossPageSendData );
                        newArgs.sendData = sendData;

                        //fix hash
                        newArgs.hash = hash;
                        newArgs.sendData.hash = hash;

                        //run the send function for the appropriate interaction type
                        //RDR.actions.interactions[int_type].send(args);
                        RDR.actions.interactions.send(newArgs, int_type, action_type);
                    });
                },
                send: function(args, int_type, action_type){
                    // RDR.actions.interactions.send
                    // /api/tag/create
                    // /api/comment/create
                    // hack to cleanup the send data
                    var sendData = $.extend( true, {}, args.sendData);
                    if (sendData.rindow) delete sendData.rindow;
                    if (sendData.settings) delete sendData.settings;
                    if (sendData.selState) delete sendData.selState;
                    if (sendData.content_node ) delete sendData.content_node;
                    if (sendData.content_node_data && sendData.content_node_data.selState ) delete sendData.content_node_data.selState;
                    if (sendData.content_node_data && sendData.content_node_data.counts ) delete sendData.content_node_data.counts;
                    if (sendData.content_node_data && sendData.content_node_data.top_interactions ) delete sendData.content_node_data.top_interactions;
                    if (sendData.content_node_data && sendData.content_node_data.$container) delete sendData.content_node_data.$container; //this was happening for delete calls.
                    if (sendData.content_node_data && sendData.content_node_data.$indicator) delete sendData.content_node_data.$indicator; //this was happening for delete calls.
                    if (sendData.content_node_data && sendData.content_node_data.$indicator_details) delete sendData.content_node_data.$indicator_details; //this was happening for delete calls.
                    if (sendData.content_node_data && sendData.content_node_data.$rindow_readmode) delete sendData.content_node_data.$rindow_readmode; //this was happening for delete calls.
                    if (sendData.node) delete sendData.node;
                    if (sendData.uiMode) delete sendData.uiMode;
                    if (sendData.sendData) delete sendData.sendData; //this was happening for delete calls.

// TODO force forcing
if ( RDR.summaries[sendData.hash] ) sendData.container_kind = RDR.summaries[sendData.hash].kind;
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
 sendData.hash = "page";
 sendData.container_kind = "text";
 sendData.page_id = sendData.page_id || RDR.util.getPageProperty('id', "page");
 delete sendData.content_node_data.hash; //this was happening for delete calls.
}
                    //todo: consider making a generic url router
                    var url = RDR_baseUrl+"/api/" +int_type_for_url+ "/"+action_type+"/";
                    var hitMax = RDR.session.checkForMaxInteractions(args);

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

                                //this will be here for new containers only
                                if( response.data && response.data.container ){
                                    args.container_id = response.data.container.id;
                                    var hash = args.hash = response.data.container.hash;
                                }
                                if ( response.data && response.data.num_interactions ) {
                                    RDR.user.num_interactions = response.data.num_interactions;
                                }
                                if ( response.status == "success" ) {
                                    if ( args.response.data.interaction ) {
                                        // RDR.events.track( action_type+'_'+int_type_for_url+'::' + args.response.data.interaction.id);
                                    } else if ( args.response.data.deleted_interaction ) {
                                        // RDR.events.track( action_type+'_'+int_type_for_url+'::' + args.response.data.deleted_interaction.interaction_node.id);
                                    }
                                    if(args.response.data.deleted_interaction){
                                        args.deleted_interaction = args.response.data.deleted_interaction;
                                    }

                                    args.scenario = ( args.response.data.existing ) ? "reactionExists": ( args.response.data.deleted_interaction ) ? "tagDeleted":"reactionSuccess";
                                    if ( typeof args.tag.id == "undefined" ) {
                                        args.tag.id = response.data.interaction.interaction_node.id;
                                    }
                                    RDR.actions.interactions[int_type].onSuccess[action_type](args);
                                }else{
                                    if ( int_type == "react" ) {
                                        if ( response.message == "sign in required for organic reactions" ) {
                                            RDR.session.showLoginPanel( args );
                                        }
                                        else {
                                            RDR.actions.interactions[int_type].onFail(args);
                                        }
                                    } else {
                                        if (response.message.indexOf( "Temporary user interaction limit reached" ) != -1 ) {
                                            // RDR.events.track( 'temp_limit_hit_r' );
                                            RDR.session.showLoginPanel( args );
                                        } 
                                        if ( response.message == "existing interaction" ) {
                                            //todo: I think we should use adapt the showTempUserMsg function to show a message "you have already said this" or something.
                                            //showTempUserMsg should be adapted to be rindowUserMessage:{show:..., hide:...}
                                                //with a message param.
                                                //and a close 'x' button.
                                                args.msgType = "existingInteraction";
                                                RDR.session.rindowUserMessage.show( args );
                                        }
                                        else {
                                            // if it failed, see if we can fix it, and if so, try this function one more time
                                            RDR.session.handleGetUserFail( args, function() {
                                                RDR.actions.interactions.ajax( args, int_type, 'create' );
                                            });
                                        }
                                    }
                                }
                                // if ( typeof RDR.inProgress === "undefined" ) { RDR.inProgress = []; }
                                // RDR.inProgress = $.grep(RDR.inProgress, function(value) {
                                //   return value != hash;
                                // });
                                RDR.util.userLoginState();
                            }
                        });
                    } else {
                        RDR.session.showLoginPanel( args, function() { RDR.actions.interactions.ajax( args, int_type, 'create' ); } );
                    }
                },
                defaultSendData: function(args){
                    //RDR.actions.interactions.defaultSendData:
                    args.user_id = RDR.user.user_id;
                    args.readr_token = RDR.user.readr_token;
                    args.group_id = RDR.group.id;
                    args.page_id = (args.page_id) ? args.page_id : RDR.util.getPageProperty('id', args.hash);

                    return args;

                },
                comment: {
                    preAjax: function(args){
                        var $rindow = args.rindow;
                        if ( $rindow ) $rindow.find('div.rdr_loader').css('visibility','visible');
                    },
                    customSendData: function(args){
                        //RDR.actions.interactions.comment.customSendData:
                    },
                    onSuccess: {
                        //RDR.actions.interactions.comment.onSuccess:
                        create: function(args){
                            //RDR.actions.interactions.comment.onSuccess.create:
                            var $rindow = args.rindow,
                                hash = args.hash,
                                response = args.response,
                                tag = args.tag;

                            //clear loader
                            if ( $rindow ) {
                                $rindow.find('div.rdr_loader').css('visibility','hidden');                                

                                //messy fixes for success responses in crossPageHash containers.
                                RDR.actions.content_nodes.quickFixReset(hash);

                                var isInlineRindow = ($rindow.hasClass('rdr_inline') || $rindow.find('.rdr_inline').length);
                                
                                var $responseMsg = $('<span class="success_msg" >Thanks for your comment! </span>');
                                var $doneButton = $('<a class="rdr_doneButton" href="#">Close</a>')
                                    .click(function(e){
                                        e.preventDefault();

                                        //there's a bug, just close the rindow for now. 
                                        // RDR.rindow.close( $rindow );
                                        RDR.rindow.safeClose( $rindow );
                                        // $rindow.find('.rdr_back').eq(0).click();
                                    });

                                var isPostTagComment = $('.rdr_subheader').length;
                                if(isPostTagComment){

                                    $('.rdr_nextActions').remove();
                                    $rindow.find('.rdr_subheader')
                                        .empty().append($responseMsg).append($doneButton);

                                }else{
                                    $rindow.find('.rdr_commentBox')
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
                                var content_nodes = RDR.content_nodes[hash];
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
                            // RDR.rindow.updateSizes( $rindow );


                            // $rindow.find('div.rdr_commentBox').find('div.rdr_tagFeedback, div.rdr_comment').hide();

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
                            RDR.actions.content_nodes.init(hash, function(){
                                RDR.actions.summaries.update(hash, diff);
                            });

                            //not using this
                            // var usrMsgArgs = {
                            //     msgType: "interactionSuccess",
                            //     interactionInfo: {
                            //         type: 'comment'
                            //     },
                            //     rindow:$rindow
                            // };

                            RDR.events.trackEventToCloud({
                                event_type: "c",
                                event_value: interaction.interaction_node.body,
                                container_hash: hash,
                                container_kind: content_node.kind,
                                page_id: args.page_id,
                                reaction_body: args.tag.tag_body
                            });

                            RDR.events.emit('readrboard.comment', interaction.interaction_node.body, { 'reaction':tag.tag_body, 'hash':hash, 'kind':content_node.kind });

                        },
                        remove: function(args){
                            //RDR.actions.interactions.comment.onSuccess.remove:

                            //clear loader
                            var $rindow = args.rindow;
                            if ( $rindow ) $rindow.find('div.rdr_loader').css('visibility','hidden');
                        }

                    },
                    onFail: function(args){
                        //clear loader
                        var $rindow = args.rindow;
                        if ( $rindow ) $rindow.find('div.rdr_loader').css('visibility','hidden');
                    }
                },
                share: {
                    preAjax: function(){
                        var $rindow = args.rindow;
                        if ( $rindow ) $rindow.find('div.rdr_loader').css('visibility','visible');
                    },
                    customSendData: function(){
                        return {};
                    },
                    onSuccess: function(args){
                        //clear loader
                        var $rindow = args.rindow;
                        if ( $rindow ) $rindow.find('div.rdr_loader').css('visibility','hidden');
                    },
                    onFail: function(args){
                        //clear loader
                        var $rindow = args.rindow;
                        if ( $rindow ) $rindow.find('div.rdr_loader').css('visibility','hidden');
                    }
                },
                // breaks the interaction convention:
                boardadd: {
                    preAjax: function(){
                        var $rindow = args.rindow;
                        if ( $rindow ) $rindow.find('div.rdr_loader').css('visibility','visible');
                    },
                    customSendData: function(){
                        return {};
                    },
                    onSuccess: {
                        //RDR.actions.interactions.react.onSuccess:
                        create: function(args){
                            //clear loader
                            
                            //carefull with this.. $('div.rdr_tag_details.rdr_reacted') without the rdr_live_hover was returning 2 nodes. shore this up later.
                            var $rindow = (args.rindow) ? args.rindow : $('div.rdr_tag_details.rdr_reacted.rdr_live_hover');
                            $rindow.find('div.rdr_loader').css('visibility','hidden');

                            var safe_board_name = args.board_name.replace(/\s/g,"_"),
                                newArgs = { board_id:args.board_id, int_id:args.int_id },
                                $success = $('<div class="rdr_success">Success!  See <a target="_blank" href="'+RDR_baseUrl+'/board/'+args.board_id+'/'+safe_board_name+'" class="rdr_seeit_link">your board.</a> <a href="javascript:void(0);" class="rdr_seeit_link rdr_undo">Undo?</a></div>');
                            
                            $rindow.find('.rdr_select_user_board').append( $success ).find('select').hide();

                            $success.find('a.rdr_undo').click( function() {
                                
                                args.rindow = $rindow;
                                // panelEvent
                                RDR.actions.interactions.ajax( args, 'boarddelete', 'create' ); // odd i know.  the board calls break convention.
                            });
                        }
                    }
                },
                // breaks the interaction convention:
                boarddelete: {
                    preAjax: function(){
                        var $rindow = args.rindow;
                        if ( $rindow ) $rindow.find('div.rdr_loader').css('visibility','visible');
                    },
                    customSendData: function(){
                        return {};
                    },
                    onSuccess: {
                        //RDR.actions.interactions.react.onSuccess:
                        create: function(args){
                            //clear loader
                            
                            var $rindow = args.rindow;
                            if ( $rindow ) $rindow.find('div.rdr_loader').css('visibility','hidden');

                        }
                    }
                },
                react: {
                    preAjax: function(args, action_type){
                        var $rindow = args.rindow;
                        if ( $rindow ) $rindow.find('div.rdr_loader').css('visibility','visible');
                    },
                    customSendData: function(args){
                        ////RDR.actions.interactions.react.customSendData:
                        //temp tie-over

                        var hash = args.hash,
                            summary = RDR.summaries[hash],
                            $container = $('[rdr-hash="'+hash+'"]'),
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
                                "user_id" : RDR.user.user_id,
                                "readr_token" : RDR.user.readr_token,
                                "group_id" : RDR.group.id,
                                "page_id" : (args.page_id) ? args.page_id : RDR.util.getPageProperty('id', hash)
                            };
                        } else  {

                            kind = summary.kind;

                            var $container = $('[rdr-hash="'+hash+'"]');

                            var rindow = args.rindow,
                                tag_li = args.tag;

                            tag = ( typeof args.tag.data == "function" ) ? args.tag.data('tag'):args.tag;

                            var content_node_data = {};
                            //If readmode, we will have a content_node.  If not, use content_node_data, and build a new content_node on success.
                            var content_node = args.content_node || null;

                            if ( kind == 'custom' ){
                                content_node_data = {
                                    'container': rindow.data('container'),
                                    'body': $container.attr('rdr-src'),
                                    'kind':'media',
                                    'location': $container.get(0).nodeName.toLowerCase(), // trying to store the tagName, so we can convert to a media type later...???
                                    'hash':hash,
                                    'item_type': ($container.hasAttr('rdr-item-type')) ? $container.attr('rdr-item-type') : ''
                                };

                            } else if(kind == 'img' || kind == 'media' || kind == 'med'){
                                var hashBody = $container[0].src;


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

                                if ( RDR.group.media_url_ignore_query && hashBody.indexOf('?') ){
                                    hashBody = hashBody.split('?')[0];
                                }

                                content_node_data = {
                                    'container': rindow.data('container'),
                                    'body': hashBody,
                                    'kind':kind,
                                    // 'location':srcProtocol + '//' + match.input.substr(0,match.index),  // http://whatever-the-subdomain-is.
                                    'hash':hash,
                                    'item_type': ($container.hasAttr('rdr-item-type')) ? $container.attr('rdr-item-type') : ''
                                };

                                //add dims
                                var mediaDims = RDR.actions.content_nodes.utils.getMediaDims($container)
                                $.extend(content_node_data, mediaDims);

                            }else{
                                //is text
                                //todo: fix this temp hackery
                                if(content_node){
                                    content_node_data = {
                                        'container': rindow.data('container'),
                                        'body': content_node.body,
                                        'location': content_node.location,
                                        'kind':kind,
                                        'id':content_node.id,
                                        'item_type': ($container.hasAttr('rdr-item-type')) ? $container.attr('rdr-item-type') : ''
                                    };
                                }else{

                                    // is it a rdr-item?  if so, let's force the content_node info, if already known
                                    // UGHUGHUGHUGHUGHUGHUGHUGHUGHUGH
                                    // i don't foxtrot think this is a doing a fucking thing.  
                                    if ( $container.hasAttr('rdr-item') && typeof RDR.summaries[hash].content_nodes != 'undefined' && RDR.summaries[hash].content_nodes.length ) {
                                        $.each( RDR.summaries[hash].content_nodes, function(content_node_id, node) {
                                            // grab the first one that is not 'undefined'
                                            if ( content_node_id != 'undefined' ) {
                                                content_node = node;
                                            }
                                        });
                                        content_node_data = {
                                            'container': rindow.data('container'),
                                            'body': content_node.body,
                                            'location': content_node.location,
                                            'kind':kind,
                                            'id':content_node.id,
                                            'item_type': $container.attr('rdr-item-type')
                                        };
                                    } else {
                                        var content_node_id = rindow.find('div.rdr_tag_'+tag.id).data('content_node_id'),
                                            selState = ( content_node_id ) ? summary.content_nodes[ content_node_id ].selState : rindow.data('selState');
                                            if(!selState){
                                                RDR.safeThrow("selState not found:  I cannot figure out why this happens every once in a while");
                                                return;
                                            }
                                        content_node_data = {
                                            'container': rindow.data('container'),
                                            'body': selState.text,
                                            'location': selState.serialRange,
                                            'kind': kind,
                                            'item_type': ($container.hasAttr('rdr-item-type')) ? $container.attr('rdr-item-type') : ''
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
                                "user_id" : RDR.user.user_id,
                                "readr_token" : RDR.user.readr_token,
                                "group_id" : RDR.group.id,
                                "page_id" : RDR.util.getPageProperty('id', hash),
                                "int_id" : args.int_id
                            };
                        }

                        return sendData;

                    },
                    onSuccess: {
                        //RDR.actions.interactions.react.onSuccess:
                        create: function(args){
                            //RDR.actions.interactions.react.onSuccess.create:
                            //todo: clean up these args.

                            // init vars
                            var $rindow = args.rindow,
                                // $tag_table = $rindow.find('table.rdr_tags'),
                                uiMode = $rindow.data('mode') || 'writeMode',
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

                            RDR.events.trackEventToCloud({
                                event_type: 're',
                                event_value: reaction,
                                reaction_body: reaction,
                                container_hash: args.hash,
                                container_kind: args.kind,
                                content_location: content_node.location,
                                content_id: (response.data.content_node) ? response.data.content_node.id:null,
                                page_id: args.page_id
                            });

                            RDR.events.emit('readrboard.reaction', reaction);

                            $('#rdr_loginPanel').remove();
                            
                            //clear loader
                            if ( $rindow ) $rindow.find('div.rdr_loader').css('visibility','hidden');

                            // remove summary loaded since we might need to call it again....
                            $('[rdr-hash="'+hash+'"]').removeAttr('rdr_summary_loaded');

                            //todo: we should always only have one tooltip - code this up in one place.
                            //quick fix for tooltip that is still hanging out after custom reaction
                            $('.rdr_twtooltip').remove();


                            if (args.kind && args.kind == "page") {
                                // RDR.actions.viewReactionSuccess( args );

                                // // either we have a hash, or we don't, and so we hope there is only one div.rdr-summary.  IE sucks.
                                // var $summary_box = $rindow.find('.rdr_tags_list');
                                // var $pageTagResponse = $('<div class="rdr_info"></div>');
                                
                                // var $shareIcons = _makeShareIcons(args);

                                var existing = args.response.data.existing;

                                if(!existing){
                                //     var $rdr_reactionMessage = $('<div class="rdr_reactSuccess rdr_reactionMessage"></div>');
                                //     var $feedbackMsg = $(
                                //         '<div class="feedbackMsg">'+
                                //             '<div class="rdr_label_icon"></div>'+
                                //             '<em>Thanks!  You reacted <strong style="color:#008be4;font-style:italic !important;">'+args.tag.body+'</strong>.</em>'+
                                //             '<span class="pipe"> | </span>'+
                                //             // '<span><a target="_blank" href="'+RDR_baseUrl+'/interaction/'+args.response.data.interaction.id+'" class="rdr_seeit_link">See it.</a></span>'+
                                //             '<span><a href="javascript:void(0);" class="rdr_undo_link">Undo?</a></span>'+
                                //         '</div>'
                                //     );
                                //     $feedbackMsg.find('a.rdr_undo_link').on('click.rdr', {args:args}, function(event){
                                //         // panelEvent - undo2
                                //         var args = event.data.args;
                                //         args.rindow = $(this).closest('.rdr_tag_details');
                                //         _undoPageReaction(args);
                                //     });

                                //     $pageTagResponse.append($feedbackMsg);
                                //     $pageTagResponse.append($shareIcons);
                                    
                                //     $pageTagResponse.append('<div class="rdr_tipReactToOtherStuff"><strong>Tip:</strong> You can <strong style="color:#008be4;">react to anything on the page</strong>. <ins>Select some text, or roll your mouse over any image or video, and look for this icon: <img src="'+RDR_staticUrl+'widget/images/blank.png" class="no-rdr" style="background:url('+RDR_staticUrl+'widget/images/readr_icons.png) 0px 0px no-repeat;margin:0 0 -5px 0;" /></ins></div>' );
                                //     $summary_box.addClass('rdr_reacted').html( $pageTagResponse );
                                    

                                    _doPageUpdates(args);
                                    
                                }else{
                                //     var $rdr_reactionMessage = $('<div class="rdr_reactionMessage"></div>');
                                //     var $feedbackMsg = $(
                                //         '<div class="feedbackMsg">'+
                                //             '<em><strong>You have already given that reaction.</em></strong>'+
                                //             '<span class="pipe"> | </span>'+
                                //             // '<span><a target="_blank" href="'+RDR_baseUrl+'/interaction/'+args.response.data.interaction.id+'" class="rdr_seeit_link">See it.</a></span>'+
                                //             '<span><a href="javascript:void(0);" class="rdr_undo_link">Undo?</a></span>'+
                                //         '</div>'
                                //     );
                                //     $feedbackMsg.find('a.rdr_undo_link').on('click.rdr', {args:args}, function(event){
                                        
                                //         // panelEvent - undo3

                                //         var args = event.data.args;
                                //         args.rindow = $(this).closest('.rdr_tag_details');
                                //         _undoPageReaction(args);
                                //     });

                                //     $pageTagResponse.append($feedbackMsg);

                                //     $pageTagResponse.append($shareIcons);
                                //     $summary_box.addClass('rdr_reacted').html( $pageTagResponse );
                                }
                                
                                // RDR.rindow.updateFooter( $rindow, '' );


                                RDR.actions.viewReactionSuccess( args );

                            } else {
                                // not a page-level reaction

                                //temp tie-over
                                var hash = args.hash,
                                    summary = RDR.summaries[hash],
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
                                // RDR.page[ PAGE ID ].containers

                                //this is weird because there is only one content_node - the img
                                //this whole thing is gross.  Fix our data structure later.

                                // stolen from the success callback in RDR.actions.content_nodes.init
                                // but wanted to not abstract that b/c this data structure is not the same.  natch.

                                if (typeof summary.content_nodes == "undefined") {
                                    summary.content_nodes = {};
                                }

                                //quick fixes for the container id too.
                                //If the container came down eariler as an unknown container,
                                //it will be saved but not have an id yet.
                                var savedContainer = RDR.containers[hash];
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
                                content_node_data = args.content_node || RDR.actions.content_nodes.make(content_node_data);

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
                                    RDR.actions.summaries.update(hash, diff);
                                }

                                // update the rindow to reflect success
                                RDR.actions.viewReactionSuccess( args );

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
                                    rindow: args.rindow
                                };
                                RDR.actions.interactions.ajax( newArgs, 'react', 'remove' );
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
                                    RDR.actions.summaries.update(args.hash, diff, true, args.page_id);
                                // }
                            }


                            function _makeShareIcons(args){
                                // embed icons/links for diff SNS

                                var socialNetworks = ["facebook","twitter", "tumblr"]; //,"tumblr","linkedin"];
                                var shareHash = args.hash;
                                var $shareWrapper = $('<div class="shareWrapper" ></div>');
                                
                                $shareWrapper.append('<strong class="rdr_share_it">Share It:</strong>');

                                $.each(socialNetworks, function(idx, val){
                                    $shareWrapper.append('<a href="http://' +val+ '.com" class="rdr_share_link"><img class="no-rdr" src="'+RDR_staticUrl+'widget/images/social-icons-loose/social-icon-' +val+ '.png" /></a>');
                                    $shareWrapper.find('a.rdr_share_link:last').click( function() {
                                        
                                        RDR.events.trackEventToCloud({
                                            // action: "share_open_attempt",
                                            // opt_label: "which: "+val+", kind: "+args.kind+", page: "+args.page_id+", tag: "+args.tag.body,
                                            event_type: "sh",
                                            event_value: val,
                                            container_kind: args.kind,
                                            page_id: args.page_id
                                        });

                                        RDR.shareWindow = window.open(RDR_staticUrl+'share.html', 'readr_share','menubar=1,resizable=1,width=626,height=436');

                                        var title = $('meta[property="og:title"]').attr('content') ?
                                            $('meta[property="og:title"]').attr('content') :
                                                $('title').text() ?
                                                $('title').text() : "";

                                        RDR.actions.share_getLink({ hash:shareHash, kind:args.kind, sns:val, rindow:{}, tag:args.tag, content_node:{content:title,kind:"page"} }); // ugh, lots of weird data nesting
                                        return false;
                                    });
                                });
                                return $shareWrapper;
                            }
                        },
                        remove: function(args){
                            //RDR.actions.interactions.react.onSuccess.remove:
                            var sendData = args.sendData;
                            var interaction_node = args.response.data.deleted_interaction.interaction_node;
                            var $rindow = args.rindow,
                                tag = args.tag,
                                int_id = args.int_id;

                            //clear loader
                            if ( $rindow ) $rindow.find('div.rdr_loader').css('visibility','hidden');

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
                                RDR.actions.summaries.update(hash, diff, isPage, args.page_id);
                            }else{
                                RDR.actions.summaries.update(hash, diff);
                            }
                            
                            var usrMsgArgs = {
                                msgType: "interactionSuccess",
                                interactionInfo: {
                                    type: 'tag',
                                    body: interaction_node.body,
                                    remove: true
                                },
                                rindow:$rindow
                            };
                            //queued up to be released in the sharestart function after the animation finishes
                            // NOT TRUE ANYMORE?
                            $rindow.queue('userMessage', function(){
                                RDR.session.rindowUserMessage.show( usrMsgArgs );
                            });
                            
                            if(isPage){
                                RDR.rindow.updatePageTagMessage( args, 'tagDeleted' );
                            }else{
                                RDR.rindow.updateTagMessage( {rindow:$rindow, tag:args.tag, scenario:"tagDeleted", args:args} );
                            }

                        }
                    },
                    onFail: function(args){
                        //RDR.actions.interactions.react.onFail:
                        //todo: we prob want to move most of this to a general onFail for all interactions.
                        // So this function would look like: doSpecificOnFailStuff....; RDR.actions.interactions.genericOnFail();

                        //clear loader
                        var $rindow = args.rindow,
                            response = args.response;
                        if ( $rindow ) $rindow.find('div.rdr_loader').css('visibility','hidden');

                        if (response.message.indexOf( "Temporary user interaction limit reached" ) != -1 ) {
                            RDR.session.receiveMessage( args, function() { RDR.actions.interactions.ajax( args, 'react', 'create' ); } );
                            RDR.session.showLoginPanel( args );
                        } else if ( response.message == "existing interaction" ) {
                            //todo: I think we should use adapt the showTempUserMsg function to show a message "you have already said this" or something.
                            //showTempUserMsg should be adapted to be rindowUserMessage:{show:..., hide:...}
                                //with a message param.
                                //and a close 'x' button.
                                args.msgType = "existingInteraction";
                                RDR.session.rindowUserMessage.show( args );
                        } else if ( response.message.indexOf("blocked this tag") != -1 ) {
                            alert('This site has blocked "'+args.tag.body+'" from being a valid reaction.\n\nPlease try something that will be more appropriate for this community.');
                        } else {
                            // if it failed, see if we can fix it, and if so, try this function one more time
                            RDR.session.handleGetUserFail( args, function() {
                                RDR.actions.interactions.ajax( args, 'react', 'create' );
                            });
                        }
                    }
                }
                //end RDR.actions.interactions
            },
            indicators: {
                show: function(hashes, boolDontFade){
                    boolDontFade = true;
                    //RDR.actions.indicators.show:
                    //todo: boolDontFade is a quick fix to not fade in indicators
                    //hashes should be an array or a single hash string
                    var $indicators = this.fetch(hashes);
                    //todo: this works for now, but use a differnet signal later
                    if ( $indicators.length == 1 ) $indicators.removeClass('rdr_dont_show');

                    var textIndicatorOpacity = ( !$.browser.msie ) ? RDR.C.indicatorOpacity : '1' ;

                    if ( !$.browser.msie || ( $.browser.msie && parseInt( $.browser.version, 10 ) > 8 ) ) {
                        $indicators.not('.rdr_dont_show').css({
                            'opacity':'0',
                            'visibility':'visible'
                        });
                        if(boolDontFade){
                            $indicators.not('.rdr_dont_show').css({
                                'opacity':textIndicatorOpacity
                            });
                            return;
                        } else {
                            $indicators.filter('div.rdr_indicator_for_text').not('.rdr_dont_show').stop().fadeTo(800, textIndicatorOpacity);
                        }
                    }

                    //use stop to ensure animations are smooth: http://api.jquery.com/fadeTo/#dsq-header-avatar-56650596
                },
                hide: function(hashes){
                    //RDR.actions.indicators.hide:
                    //hashes should be an array or a single hash string
                    //it fails gracefully if there are no indicators for the hashed container ( $indcators will just be empty and do nothing )
                    var $indicators = this.fetch(hashes);
                    $indicators.css({
                        'opacity':'0',
                        'visibility':'hidden'
                    });
                },
                fetch: function(hashOrHashes){
                    //RDR.actions.indicators.fetch:
                    //a helper to get an $indicators obj from a hash or list of hashes
                    var $indicators = $();
                    if( typeof hashOrHashes === "string" ){
                        var hash = hashOrHashes;
                        $indicators = $('#rdr_indicator_'+hash);
                    }
                    else{
                        //should be an array of hashes
                        var hashes = hashOrHashes;
                        $.each(hashes, function(idx, hash){
                            $indicators = $indicators.add( $('#rdr_indicator_'+hash) );
                        });
                    }
                    return $indicators;
                },
                init: function(hash){
                    //RDR.actions.indicators.init:
                    //note: this should generally be called via RDR.actions.containers.setup
                    
                    //note: I believe this is being double called for text right now, but it's not hurting anything... fix later though.
                    var scope = this;
                    var summary = RDR.summaries[hash];
                    if (typeof summary != "undefined" && summary.$container.hasAttr('rdr-node')) {
                        var kind = summary.kind,
                            $container = summary.$container,
                            indicatorId = 'rdr_indicator_'+hash,
                            indicatorBodyId = 'rdr_indicator_body_'+hash,
                            indicatorDetailsId = 'rdr_indicator_details_'+hash;

                        // don't insert floating pins for page-level interactions
                        if ( $container.hasAttr('rdr-page-container') ) return;
                        //else

                        $container.attr('rdr-hasIndicator', 'true');

                        if ( $container.hasAttr('rdr-item') ) {

                            var customDisplayName = $container.attr('rdr-item'),
                                $indicator = summary.$indicator = $container, // might work?  $indicator is storing important data...
                                $counter = $('[rdr-counter-for="'+customDisplayName+'"]'),
                                $grid = $('[rdr-view-reactions-for="'+customDisplayName+'"]'),
                                $cta = $('[rdr-cta-for="'+customDisplayName+'"]');

                            // some init.  does this make sense here?
                            _setupHoverToFetchContentNodes();

                            // if there is a counter on the page
                            if ( $counter.length ) {
                                $counter.addClass('rdr_count');
                            }
                            if ( $cta.length ) {
                                _customDisplaySetupHoverForShowRindow($cta);
                                _showRindowAfterLoad();
                            }
                            if ( $grid.length ) {
                            }
                            RDR.actions.indicators.update(hash);

                        } else {
                            //check for and remove any existing indicator and indicator_details and remove for now.
                            //this shouldn't happen though.
                            //todo: solve for duplicate content that will have the same hash.
                            $('#rdr_indicator_'+hash).remove();
                            $('#rdr_container_tracker_'+hash).remove();
                            $('#rdr_indicator_details_'+hash).remove();

                            if ($('#rdr_indicator_'+hash).length) {
                                return;
                            }
                            var $indicator = summary.$indicator = $('<div class="rdr_indicator" />').attr('id',indicatorId).data('hash',hash);
                            // //init with the visibility hidden so that the hover state doesn't run the ajax for zero'ed out indicators.
                            // $indicator.css('visibility','hidden');

                            _setupIndicators();

                            if(!kind){
                                //todo: I'll look into the source of this this, but this should work fine for now.
                                // RDR.safeThrow('indicator container has no kind attribute');
                                return;
                            }
                            //run setup specific to this type
                            RDR.actions.indicators.utils.kindSpecificSetup[kind]( hash );


                            //todo: combine this with the kindSpecificSetup above right?
                            if (kind == 'text'){
                                function _getTextNodesIn(el) {
                                    return $(el).find(":not(iframe,noscript)").andSelf().contents().filter(function() {
                                        return this.nodeType == 3;
                                    });
                                }

                                if ( $container.find('img').length && !_getTextNodesIn($container).length ) {
                                    RDR.actions.stripRdrNode($container);
                                    return;
                                }



                                $container.unbind('.rdr_helper');
                                // todo: touchHover
                                
                                if(!isTouchBrowser){
                                    $container.bind('mouseenter.rdr_helper', function() {
                                        var hasHelper = $indicator.hasClass('rdr_helper') && RDR.group.paragraph_helper;
                                        if ( hasHelper) {
                                            RDR.actions.indicators.helpers.over($indicator);
                                        }
                                    });
                                    $container.bind('mouseleave.rdr_helper', function(e) {
                                        var hasHelper = $indicator.hasClass('rdr_helper') && RDR.group.paragraph_helper;
                                        if ( hasHelper ) {
                                            RDR.actions.indicators.helpers.out($indicator);
                                        }
                                    });
                                } else {
                                    $container.off('touchend.rdr').on('touchend.rdr', function(e){
                                        if (RDR.util.bubblingEvents['dragging'] == true ) { return; }
                                        if (RDR.util.bubblingEvents['touchend'] == false) {
                                            if ( !$('.rdr_window').length ) {
                                                var $this_container = $('[rdr-hash="'+hash+'"]');
                                                // var $container = $(e.target);

                                                var el = $this_container[0]
                                                $('document').selog('selectEl', el);

                                                var $rindow = RDR.rindow.make( "writeMode", {hash:hash} );
                                            } else {
                                                RDR.actions.UIClearState();
                                            }
                                        }
                                    });
                                }

                                //This will be either a helperIndicator or a hidden indicator
                                var isZeroCountIndicator = !( summary.counts.tags > 0 );

                                $indicator.data('isZeroCountIndicator', isZeroCountIndicator);
                                if(isZeroCountIndicator){
                                    $indicator.addClass('rdr_helper');
                                    // if(isTouchBrowser){
                                    //     $indicator.addClass('isTouchBrowser');
                                    // }
                                    _setupHoverForShowRindow();
                                }else{
                                    _setupHoverToFetchContentNodes(function(){
                                        _setupHoverForShowRindow();
                                        _showRindowAfterLoad();
                                    });
                                }
                            }

                            //of course, don't pass true for shouldReInit here.
                            RDR.actions.indicators.update(hash);

                        } // /else of if (rdr-item) conditional
                    }

                    /*helper functions */
                    function _setupIndicators(){

                        //$indicator_body is used to help position the whole visible part of the indicator away from the indicator 'bug' directly at 
                        var $indicator_body = summary.$indicator_body = $('<div class="rdr rdr_indicator_body " />')
                            .attr('id',indicatorBodyId)
                            .appendTo($indicator)
                            .append(
                                '<img src="'+RDR_staticUrl+'widget/images/blank.png" class="no-rdr rdr_pin" />',
                                '<span class="rdr_count" />', //the count will get added automatically later, and on every update.
                                '<span class="rdr_count_label" />' 
                            );

                        $indicator.css('visibility','visible');
                    }



                    function _setupHoverForShowRindow(){
                        if (!isTouchBrowser) {
                            $indicator.on('mouseover.showRindow', function(){
                                _makeRindow();
                                var hasHelper = $indicator.hasClass('rdr_helper') && RDR.group.paragraph_helper;
                                if( hasHelper ){
                                    // RDR.events.track('paragraph_helper_engage');
                                }
                            });
                        } else {
                            $indicator.on('touchend.rdr', function(e){
                                if (RDR.util.bubblingEvents['dragging'] == true ) { return; }
                                RDR.util.bubblingEvents['touchend'] = true;

                                _makeRindow();
                                var hasHelper = $indicator.hasClass('rdr_helper') && RDR.group.paragraph_helper;
                                if( hasHelper ){
                                    // RDR.events.track('paragraph_helper_engage');
                                }
                            });
                        }
                    }
                    function _makeRindow(){
                        //only allow one indicator rindow.
                        //todo - replace this with the code below - but need to deal with selstate hilites first
                        if($indicator.$rindow){
                            // dont rewrite the window if it already exists...
                            // adding to prevent tagBox text animation.  if this is problematic, just go prevent the animation but let this redraw.
                            if ( $indicator.$rindow.data('container') == hash ) { return; }
                            $indicator.$rindow.remove();
                        }
                        // if(summary.$rindow){
                        //     summary.$rindow.remove();
                        // }
                        // if(summary.$rindow_readmode){
                        //     summary.$rindow_readmode.remove();
                        // }
                        //end - todo

                        var $rindow = RDR.rindow.make( "readMode", {hash:hash} );
                        var page_id = RDR.util.getPageProperty('id', hash );

                        //This bug goes all the way back to the big-ol-nasty function RDR.rindow._rindowTypes.writeMode.make.
                        //fix later, but it's fine to return here - must be getting called twice and will build correctly the 2nd time.
                        if(!$rindow){
                            return;
                        }

                        $indicator.$rindow = $rindow;
                        
                        //these should probably be moved under tagMode.make (called by rindow.make) where the image tracking lives.
                        if( $indicator.data('isZeroCountIndicator') ){
                            _updateRindowForHelperIndicator();

                            // RDR.events.track('paragraph_helper_show');

                            // DONT FIRE... too many events
                            // RDR.events.trackEventToCloud({
                            //     // category: "engage",
                            //     // action: "rindow_shown_indicatorhelper",
                            //     // opt_label: "kind: text, hash: " + hash,
                            //     event_type: 'rindow_show',
                            //     event_value: 'indicator_helper',
                            //     container_hash: hash,
                            //     container_kind: "text",
                            //     page_id: page_id
                            // });
                        }else{
                            // RDR.events.track( 'view_node::'+hash, hash );
                            RDR.events.trackEventToCloud({
                                // category: "engage",
                                // action: "rindow_shown_readmode",
                                // opt_label: "kind: text, hash: " + hash,
                                event_type: 'rs',
                                event_value: 'rd',
                                container_hash: hash,
                                container_kind: "text",
                                page_id: page_id
                            });
                        }

                    }
                    function _updateRindowForHelperIndicator(){
                        var $rindow = $indicator.$rindow;
                        var $header = RDR.rindow.makeHeader("What do you think?");
                        $rindow.addClass('rdr_helper_rindow');
                        $rindow.find('.rdr_header').replaceWith($header);
                        $header.append('<div class="rdr_header_arrow"><img src="'+RDR_staticUrl+'widget/images/header_up_arrow.png" /></div>');
                        $rindowBody = $('<div class="rdr_body rdr_visiblePanel" />');
                        $rindowBody.html('');
                        $rindow.find('div.rdr_body_wrap').append($rindowBody);
                        RDR.rindow.updateFooter( $rindow, '<span class="rdr_cta_msg">Click to respond</span>' );
                        $rindow.find('.rdr_footer').addClass('rdr_cta').find('.rdr_cta_msg').click( function() {
                            $rindow.remove();
                            var $container = $('[rdr-hash="'+hash+'"]');
                            var el = $container[0]
                            $('document').selog('selectEl', el);
                            $rindow = RDR.rindow.make( "writeMode", {hash:hash} );
                        });

                        // RDR.rindow.updateSizes(
                        //     $rindow, {
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
                           if ( !$indicator.hasAttr('rdr-item') ) {
                                RDR.actions.content_nodes.init(hash, callback);
                            } 
                        } else {
                            $indicator.on( 'mouseover.contentNodeInit' , function(){
                                // not sure about this, but we're not initializing ON MOUSEOVER the content nodes for a node w/ custom display
                                if ( !$indicator.hasAttr('rdr-item') ) {
                                    RDR.actions.content_nodes.init(hash, callback);
                                }
                            });
                        }
                    }
                    function _showRindowAfterLoad(){
                        $indicator.unbind('mouseover.contentNodeInit');
                        if (isTouchBrowser) {
                            $indicator.triggerHandler('touchend.showRindow');
                        } else {
                            $indicator.triggerHandler('mouseover.showRindow');
                        }
                    }

                    function _customDisplaySetupHoverForShowRindow($cta){
                        // SUPPORTS ONE:
                        // $cta.on('mouseover.showRindow', function(){
                        //     _customDisplayMakeRindow($cta);
                        //     var hasHelper = $indicator.hasClass('rdr_helper') && RDR.group.paragraph_helper;
                        //     if( hasHelper ){
                        //         // RDR.events.track('paragraph_helper_engage');
                        //     }
                        // });
                        
                        // SUPPORTS TWO:
                        $cta.each( function() {
                            var $thisCTA = $(this);
                            $thisCTA.attr('rdr-kind', kind).unbind('mouseover.showRindow, touchend.showRindow').on('mouseover.showRindow, touchend.showRindow', function(){
                                _customDisplayMakeRindow($thisCTA);
                                // var hasHelper = $indicator.hasClass('rdr_helper') && RDR.group.paragraph_helper;
                                // if( hasHelper ){
                                    // RDR.events.track('paragraph_helper_engage');
                                // }
                            });
                        });
                    }
                    function _customDisplayMakeRindow($cta) {
                        // see if this is a read+write mode cta, or just one "mode"
                        if ( $cta.attr('rdr-mode').indexOf('write') != -1 && $cta.attr('rdr-mode').indexOf('read') != -1 ) {
                            var mode = ( summary.counts.tags > 0 ) ? "readMode":"writeMode";
                        } else {
                            var mode = ( $cta.attr('rdr-mode') == "write" ) ? "writeMode":"readMode";
                        }

                        //todo - replace this with the code below - but need to deal with selstate hilites first
                        if($indicator.$rindow && $indicator.$rindow.hasClass('rdr_'+mode.toLowerCase() ) ){
                            // dont rewrite the window if it already exists...
                            // adding to prevent tagBox text animation.  if this is problematic, just go prevent the animation but let this redraw.
                            if ( $indicator.$rindow.data('container') == hash ) { return; }
                            $indicator.$rindow.remove();
                        }

                        // if(summary.$rindow){
                        //     summary.$rindow.remove();
                        // }
                        // if(summary.$rindow_readmode){
                        //     summary.$rindow_readmode.remove();
                        // }
                        //end - todo
                        if (mode=="writeMode") {
                            if($container.length){
                                el = $container[0];
                            }else{
                                // hash = hash || testHash;
                                var selector = '[rdr-hash="' + hash + '"]';
                                el = $(selector)[0];
                            }
                            $('document').selog('selectEl', el);
                        }

                        var $rindow = RDR.rindow.make( mode, {hash:hash, '$custom_cta':$cta } );
                        var page_id = RDR.util.getPageProperty('id', hash );

                        //This bug goes all the way back to the big-ol-nasty function RDR.rindow._rindowTypes.writeMode.make.
                        //fix later, but it's fine to return here - must be getting called twice and will build correctly the 2nd time.
                        if(!$rindow){
                            return;
                        }

                        $indicator.$rindow = $rindow;

                        var event_value = ($cta.attr('rdr-mode')=="write") ? 'wr':'rd';

                        // RDR.events.track( 'view_node::'+hash, hash );
                        // RDR.events.track('start_react_text');

                        // wtf is this here for?
                        // RDR.events.trackEventToCloud({
                        //     // category: "engage",
                        //     // action: "rindow_shown_"+ $cta.attr('rdr-mode') +"mode",
                        //     // opt_label: "kind: text, hash: " + hash,
                        //     event_type: 'rs',
                        //     event_value: event_value,
                        //     container_hash: hash,
                        //     container_kind: "text",
                        //     page_id: page_id
                        // });

                    }
                },
                update: function(hash, shouldReInit){
                    //RDR.actions.indicators.update:

                    var scope = this;
                    var summary = RDR.summaries[hash],
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
                    if ( $container.hasAttr('rdr-item') ) {
                            var customDisplayName = $container.attr('rdr-item'),
                            $indicator = summary.$indicator = $container, // might work?  $indicator is storing important data..,
                            $counter = $('[rdr-counter-for="'+customDisplayName+'"]'),
                            $label = $('[rdr-reactions-label-for="'+customDisplayName+'"]'),
                            $grid = $('[rdr-view-reactions-for="'+customDisplayName+'"]'),
                            $cta = $('[rdr-cta-for="'+customDisplayName+'"]');

                        // some init.  does this make sense here?

                            // if there is a counter on the page
                            if ( $counter.length ) {
                                if ( summary.counts.tags > 0 ) {
                                    if ( summary.counts.tags > 1 ) { $label.text('Reactions'); } else { $label.text('Reaction'); }
                                    $counter.html( RDR.commonUtil.prettyNumber( summary.counts.tags ) );
                                // } else if ( typeof summary.content_nodes != 'undefined' ) {
                                    // $.each( summary.content_nodes, function(idx, content_node) {
                                    //     summary.counts = $.extend(true, {}, content_node.counts );
                                    //     summary.top_interactions = $.extend(true, {}, content_node.top_interactions );
                                    // });
                                    // $counter.html( RDR.commonUtil.prettyNumber( content_node_summary.counts.tags ) );
                                // } else {
                                //     $counter.html('0');
                                }
                            }
                            if ( $cta.length ) {
                            }
                            if ( $grid.length ) {
                            }
                    } else {

                        //re-init if we want a 'hard reset'
                        if(shouldReInit){
                        
                            if(isText){
                                //damn it - kill them all!  Dont know why the helpers were still adding a second indicator
                                $container.closest('[rdr-node]').find('.rdr_indicator').remove();
                            }else{
                                // summary.$indicator.remove();
                                // $('#rdr_container_tracker_'+hash).remove();
                            }

                            RDR.actions.indicators.init(hash);
                            //this will loop back from the .init, which does not pass true for shouldReInit - so no infinite loop.
                            return;
                        }
                        
                        var $indicator = summary.$indicator,
                            $indicator_body = summary.$indicator_body,
                            $indicator_details = summary.$indicator_details;

                        //$indicator_body is used to help position the whole visible part of the indicator away from the indicator 'bug' directly at
                        var $count = $indicator_body.find('.rdr_count'),
                            $count_label = $indicator_body.find('.rdr_count_label'),
                            $details_header_count = ($indicator_details) ? $indicator_details.find('div.rdr_header h1'):false,
                            hasReactions = summary.counts.tags > 0;

                        var reactionLabel = (summary.counts.tags>1) ? "Reactions" : "Reaction";
                        if ( hasReactions ) {
                            if (isText) {
                                $count.html( RDR.commonUtil.prettyNumber( summary.counts.tags ) );
                                $count_label.text(reactionLabel);
                            } else {
                                $count.html( RDR.commonUtil.prettyNumber( summary.counts.tags ) + ' ' + reactionLabel );
                            }
                            if ($details_header_count) $details_header_count.html( RDR.commonUtil.prettyNumber( summary.counts.tags ) + " Reactions" );

                            RDR.actions.indicators.show(hash);
                            
                        } else {
                            $indicator.addClass('rdr_no_reactions');
                            $count.html( '<span class="rdr_react_label">What do you think?</span>' );
                            
                            if(isText){
                                if(RDR.group.paragraph_helper){
                                    RDR.actions.indicators.show(hash);
                                    $indicator.addClass('rdr_helper');
                                    // if(isTouchBrowser){
                                    //     $indicator.addClass('isTouchBrowser');
                                    // }
                                }else{
                                    RDR.actions.indicators.hide(hash);
                                }                                                        
                            }
                        }
                    }

                },
                helpers: {
                    //RDR.actions.indicators.helpers:
                    over: function($indicator){
                        //RDR.actions.indicators.helpers.over:

                        // RDR.events.track('paragraph_helper_show');

                        var alreadyHovered = $indicator.data('containerHover');
                        if( alreadyHovered ){
                            return;
                        }

                        // fade in.
                        // removing for now. UI feedback was "I didn't see that" from a small sample.
                        // $indicator.data('containerHover', true);
                        // var hoverTimeout = setTimeout(function(){
                        //     var hasHover = $indicator.data('containerHover');
                            
                        //     if(hasHover){
                                
                        //         RDR.util.cssSuperImportant( $indicator, { display:"inline" });
                                
                        //         // $indicator
                        //         //     .css('opacity',0)
                        //         //     .animate({
                        //         //         'opacity': RDR.C.helperIndicators.opacity
                        //         //         }, RDR.C.helperIndicators.fadeInTime );
                        //     }
                        // }, RDR.C.helperIndicators.hoverDelay);
                        // $indicator.data('hoverTimeout', hoverTimeout);
                        // if(isTouchBrowser){
                            // $indicator.css({ display:"inline" });
                        // }else{
                            RDR.util.cssSuperImportant( $indicator, { display:"inline" });
                        // }
                        $indicator.css('opacity', RDR.C.helperIndicators.opacity);
                    },
                    out: function($indicator){
                        //RDR.actions.indicators.helpers.out:
                        
                        //temp hack
                        //don't fade it out if the rindow is showing
                            // var hash = $indicator.data('hash');
                            // var summary = RDR.summaries[ hash ];
                            // var $rindow = (typeof summary != "undefined" && typeof summary.$rindow_readmode != "undefined") ? summary.$rindow_readmode:null;
                            // if( $rindow && $rindow.is(':visible') ){
                            //     // return;
                            // }

                        $indicator.data('containerHover', false);
                        var hoverTimeout = $indicator.data('hoverTimeout');
                        clearTimeout(hoverTimeout);
                        if(isTouchBrowser){
                            // $indicator.css({ display:"none" });
                        }else{
                            RDR.util.cssSuperImportant( $indicator, { display:"none" });
                        }
                    }
                },
                utils:{
                    checkTrailingWhiteSpace: function($container){
                        //RDR.actions.indicators.utils.checkTrailingWhiteSpace:

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
                    //RDR.actions.indicators.utils:
                    kindSpecificSetup: {
                        img: function( hash ){
                            var summary = RDR.summaries[hash],
                                $container = summary.$container,
                                $indicator = summary.$indicator,
                                $indicator_body = summary.$indicator_body,
                                $container_tracker_wrap = $('#rdr_container_tracker_wrap'),
                                $container_tracker = $('<div class="rdr_container_tracker" />'),
                                indicatorDetailsId = 'rdr_indicator_details_'+hash,
                                page_id = RDR.util.getPageProperty('id', hash );

                            if( $container.width() < 160 ){
                                RDR.safeThrow('Too small to init.');
                                return;
                            }

                            if( $container.css('display') == 'none' || $container.css('visibility') == 'hidden' ){
                                RDR.safeThrow('not visible: ');
                                return;
                            }

                            var $existing = $('#rdr_container_tracker_'+hash);
                            if($existing.length){
                                RDR.safeThrow('Images are not expected to get re-inited.');
                                return;
                            }

                            $container_tracker.attr('id', 'rdr_container_tracker_'+hash).appendTo($container_tracker_wrap);
                            //position the containerTracker at the top left of the image or videos.  We'll position the indicator and hiliteborder relative to this.

                            _commonSetup();
                            $indicator.appendTo($container_tracker);
                            
                            if(isTouchBrowser){
                                $indicator.bind('tap', function(){
                                    if ( summary.counts.interactions == 0 ) {
                                        var $rindow = RDR.rindow.make( "writeMode", {hash:hash} );
                                    } else {
                                        var $rindow = RDR.rindow.make( "readMode", {hash:hash} );    
                                    }
                                    $(this).addClass('rdr_live_hover');
                                });
                            }else{
                                $indicator
                                    .on('mouseenter', function() {
                                        if ( summary.counts.interactions == 0 ) {
                                            var $rindow = RDR.rindow.make( "writeMode", {hash:hash} );
                                        } else {
                                            var $rindow = RDR.rindow.make( "readMode", {hash:hash} );    
                                        }
                                        $(this).addClass('rdr_live_hover');
                                    })//chain
                                    .on('mouseleave', function() {
                                        $(this).removeClass('rdr_live_hover');
                                    });
                            }

                            //todo: move this from init
                            RDR.actions.indicators.utils.updateContainerTracker(hash);

                            function _commonSetup(){
                                // NEWVIDEO TEST
                                // deprecated?
                                if ( $('div.rdr_media_details').not('rdr_loaded').length ) {
                                    var $indicator_details = summary.$indicator_details = $('<div />').attr('id',indicatorDetailsId)//chain
                                        .addClass('rdr rdr_indicator_details rdr_widget rdr_widget_bar');

                                    $('div.rdr_media_details').html( $indicator_details );
                                    $container_tracker.addClass('rdr_inline_video');
                                    
                                    //what is this?  There should only be one sandbox right?
                                    $('div.rdr_media_details').addClass('rdr_sandbox');
                                } else {
                                    var $indicator_details = summary.$indicator_details = $('<div />').attr('id',indicatorDetailsId)//chain
                                    .addClass('rdr rdr_indicator_details rdr_widget rdr_widget_bar')//chain
                                    .appendTo('#rdr_indicator_details_wrapper');
                                }

                                $indicator_details.data('container',hash);
                                //later we should consolodate the use of 'container' and 'hash' as the key
                                $indicator_details.data('hash',hash);
                                $indicator_details.data('summary',summary);

                                $indicator_details.addClass('rdr_indicator_details_for_media').click(
                                    function() {
                                        $indicator_details.addClass('rdr_live_hover');
                                        RDR.actions.containers.media.onEngage( hash );
                                    }
                                );

                                // $indicator.addClass('rdr_indicator_for_media rdr_indicator_for_media_inline').find('.rdr_indicator_body').append('<div class="rdr_chevron_cta"><i class="rdr_icon-chevron-down"></i></div>');
                                $indicator.addClass('rdr_indicator_for_media rdr_indicator_for_media_inline').find('.rdr_indicator_body'); // .append('<div class="rdr_chevron_cta"><i class="rdr_icon-chevron-down"></i></div>');
                                if(isTouchBrowser){
                                    $indicator.bind('tap', function(){
                                        $(this).toggleClass('rdr_hover');
                                    });
                                }
                            }

                        },
                        media: function( hash ){
                            //for now just treat it like an img
                            this.img( hash );
                        },
                        text: function( hash ){
                            var summary = RDR.summaries[hash],
                                $container = summary.$container,
                                $indicator = summary.$indicator,
                                $indicator_body = summary.$indicator_body,
                                $actionbar = $('rdr_actionbar_'+hash);

                            $indicator.addClass('rdr_indicator_for_text').addClass('rdr_dont_show');
                            // $indicator.addClass('rdr_indicator_for_text');  //.addClass('rdr_dont_show');

                            var startOfTrailingWhiteSpace = RDR.actions.indicators.utils.checkTrailingWhiteSpace($container);

                            if(startOfTrailingWhiteSpace){
                                $(startOfTrailingWhiteSpace).before($indicator);
                            }else{
                                $indicator.appendTo($container);
                            }
                        }
                    },
                    makeDetailsContent: function( hash ){
                        //RDR.actions.indicators.utils.makeDetailsContent:
                        var scope = this;
                        var summary = RDR.summaries[hash],
                            $container = summary.$container,
                            $indicator = summary.$indicator,
                            $indicator_body = summary.$indicator_body,
                            $indicator_details = summary.$indicator_details,
                            $actionbar = $('rdr_actionbar_'+hash);

                        if ( typeof $indicator != "undefined" ) {
                            //just rebuild them
                            $indicator_details.find('div.rdr_body_wrap').remove();
                            // $oldDetails.remove();

                            //update the header
                            var headerText = RDR.rindow.makeDefaultPanelMessage($indicator_details);
                            var $header = RDR.rindow.makeHeader( headerText );
                            
                            var $bodyWrap = $('<div class="rdr rdr_body_wrap rdr_clearfix" />');
                                

                            var kind = summary.kind;
                            var isMediaContainer = kind=="img" ||
                                kind=="image" ||  // [pb] really?
                                kind=="imgage" ||
                                kind=="med" ||
                                kind=="media";

                            //builds out the $tagsList contents
                            if (isMediaContainer && !$indicator_details.find('div.rdr_view_success').length ){
                                $indicator_details.data( 'initialWidth', $container.width() );
                            }

                            var $rindow = $indicator_details;
                            var $tagsListContainer = RDR.actions.indicators.utils.makeTagsListForInline( $rindow );

                            $bodyWrap.append($tagsListContainer);

                            $indicator_details.empty().append( $header, $bodyWrap );
                        }
                    },

                    //move these from indicators-  they dont belong here
                    makeTagsListForInline: function( $rindow, isWriteMode, page ){
                        //RDR.actions.indicators.utils.makeTagsListForInline:
                        // page is the page object, not a boolean

                        var hash = $rindow.data('hash') || $rindow.attr('rdr-hash');
                        
                        var isPage = !hash || hash == "page";

                        var summary = !isPage ? RDR.summaries[hash] : {};
                        
                        var default_reactions = RDR.groupSettings.getBlessedTags(hash);

                        var reactionViewStyle = $rindow.attr('rdr-view-style') || 'grid';

                        // For IE8 and earlier version.
                        if (!Date.now) {
                          Date.now = function() {
                            return new Date().valueOf();
                          }
                        }

                        var $tagsListContainer = $('<div class="rdr_body rdr_tags_list rdr_'+reactionViewStyle+'" />').data('now', Date.now()),
                            $tagsListContainerCopy = $('<div class="rdr_body rdr_tags_list" />').data('now', Date.now());  // wtf
                        
                        var $existingTagslist = $rindow.find('.rdr_tags_list');
                        $rindow.find('.rdr_body_wrap').append($tagsListContainer);
                        $existingTagslist.remove();

                        if ( typeof page != "undefined" ) {
                            // page-level / summary bar
                            if ( !isWriteMode && page.toptags.length ) {
                                // write page-level tags: readmode

                                // actually, these should always be sorted already - dont think we need this.
                                // RDR.actions.summaries.sortByTags(page.toptags);

                                writeTagBoxes( page.toptags );
                                RDR.rindow.updateFooter( $rindow, '<span class="rdr_cta_msg">What do you think?</span>' );
                                $rindow.find('.rdr_footer').addClass('rdr_cta').find('span.rdr_cta_msg').click( function() {
                                    $rindow.remove();
                                    $rindow = RDR.rindow.make( "writeMode", { hash:'page', page:page, is_page:true } );
                                });
                            } else {
                                // write page-level tags: writemode
                                var $header = RDR.rindow.makeHeader( 'What do you think?' ),
                                    isWriteMode = true;
                                $rindow.find('.rdr_header').replaceWith($header);
                                writeTagBoxes(default_reactions);
                                var $custom_tagBox = RDR.rindow.writeCustomTag( $tagsListContainer, $rindow );
                                $rindow.removeClass('rdr_rewritable');

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
                                RDR.actions.summaries.sortInteractions(hash);
                                writeTagBoxes( summary.interaction_order );
                                if ( summary.kind =="text" ) {
                                    if ( !summary.crossPage ) {
                                        RDR.rindow.updateFooter( $rindow, '<span class="rdr_cta_msg">What do you think?</span>' );
                                        $rindow.find('.rdr_footer').addClass('rdr_cta').find('.rdr_cta_msg').click( function() {
                                            $rindow.remove();
                                            var $container = $('[rdr-hash="'+hash+'"]');
                                            var el = $container[0]
                                            $('document').selog('selectEl', el);
                                            $rindow = RDR.rindow.make( "writeMode", {hash:hash} );
                                        });
                                    }
                                } else {
                                    RDR.rindow.updateFooter( $rindow, '<span class="rdr_cta_msg">What do you think?</span>' );
                                    $rindow.find('.rdr_footer').addClass('rdr_cta').find('.rdr_cta_msg').click( function() {
                                        $rindow.remove();
                                        $rindow = RDR.rindow.make( "writeMode", {hash:hash} );
                                    });
                                }
                            } else {
                                RDR.rindow.updateFooter( $rindow, '<span class="rdr_no_reactions_msg rdr_clearfix">No reactions yet!</span>' );
                            }
                        }

                        // mode-specific addition functionality that needs to precede writing the $rindow to the DOM
                        if ( typeof page == "undefined" && isWriteMode ) {
                            // the custom_tag is used for simulating the creation of a custom tagBox, to get the right width
                            // var custom_tag = {count:0, id:"custom", body:"Add your own"},
                            var $custom_tagBox = RDR.rindow.writeCustomTag( $tagsListContainer, $rindow );
                                $rindow.removeClass('rdr_rewritable');
                        }


                        // mode-specific addition functionality that needs to come AFTER writing the $rindow to the DOM
                        if ( !isTouchBrowser) {
                            $rindow.on( 'mouseleave', function(e) {
                                var $this = $(this),
                                    timeoutCloseEvt;

                                timeoutCloseEvt = setTimeout(function(){
                                    // if ( $this.hasClass('rdr_rewritable') ) {
                                        $this.remove();
                                    // }
                                },300);

                                $(this).data('timeoutCloseEvt', timeoutCloseEvt);
                            }).on('mouseenter', function() {
                                var timeoutCloseEvt = $(this).data('timeoutCloseEvt');
                                clearTimeout(timeoutCloseEvt);
                            });
                            
                            //note: wrapped in !touchBrowser above
                            if ( typeof summary !="undefined" && summary.kind == "text" && !$.isEmptyObject( summary.content_nodes )) {
                                $rindow.find('div.rdr_box').each( function() {
                                    $(this).hover(
                                        function() {
                                            var selState = summary.content_nodes[$(this).find('div.rdr_tag').data('content_node_id')].selState;
                                            //make sure it's not already transitiontion into a success state
                                            //hacky because sometimes it doesnt have the data for 1 yet
                                            var isPanelState1 = !$rindow.data('panelState') || $rindow.data('panelState') === 1;
                                            if( isPanelState1 ){
                                                $().selog('hilite', selState, 'on');
                                                $rindow.data('selState', selState);
                                            }
                                        },
                                        function() {
                                            var selState = summary.content_nodes[$(this).find('div.rdr_tag').data('content_node_id')].selState;
                                            //make sure it's not already transitiontion into a success state
                                            //hacky because sometimes it doesnt have the data for 1 yet
                                            var isPanelState1 = !$rindow.data('panelState') || $rindow.data('panelState') === 1;
                                            if( isPanelState1 ){
                                                $().selog('hilite', selState, 'off');                                        
                                            }
                                        }
                                    );
                                });
                            }
                        
                        }

                        if(isPage){
                            
                        }

                        // $tagsListContainer.append($tag_table);
                        // RDR.rindow.jspUpdate($rindow);
                        // $rindow.find('.rdr_body_wrap').append($tagsListContainer);
                        if ( reactionViewStyle == "grid" || isWriteMode ) {
                            isotopeTags( $tagsListContainer );
                            isotopeFillGap($tagsListContainer);
                        } else {
                            // $tagsListContainer.find('.rdr_box').addClass('rdr_animated');
                            var tagBoxesCount = $tagsListContainer.find('div.rdr_box').length,
                                currentTagBoxAnimating = 0;
                            // var animationQueue = setInterval( animateNextBox, 10 );
                            var animationQueue = setInterval( function() { animateNextBox(); }, 20 );

                            function animateNextBox() {
                                var $thisBox = $tagsListContainer.find('div.rdr_box:eq('+currentTagBoxAnimating+')');
                                $thisBox.addClass('rdr_animated');
                                currentTagBoxAnimating++;
                                if ( currentTagBoxAnimating > tagBoxesCount ) {
                                    clearInterval( animationQueue );
                                }
                            }
                        }

                        return $tagsListContainer;

                        
                        // sort a list of tags into their buckets
                        // private function, but could be a RDR.util or RDR.tagBox function
                        function createTagBuckets( tagList ) {
                            // would rather this property was .count, not .tag_count.  #rewrite.
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
                                if ( max > 15 && tag.tag_count >= (Math.floor( max*0.8 )) ) {
                                    buckets.big.push( tag );
                                    return;
                                } else if ( tag.tag_count > midValue ) {
                                    buckets.medium.push( tag );
                                    return;
                                } else {
                                    buckets.small.push( tag );
                                    return;
                                }
                            });

                            return buckets;
                        }


                        function writeTagBoxes( tagList ) {
                            if ( !tagList.length ) { return; }

                            var buckets = createTagBuckets( tagList ),
                                bucketTotal = buckets.big.length+buckets.medium.length+buckets.small.length,
                                colorInt = 1;

                            // if a grid, size the rindow based on # of reactions
                            if ( reactionViewStyle == 'grid') {
                                if ( bucketTotal > 6 && !isWriteMode ) {
                                    if(isTouchBrowser){
                                        RDR.rindow.tagBox.setWidth( $rindow, 320 );
                                    }else{
                                        RDR.rindow.tagBox.setWidth( $rindow, 480 );
                                    }
                                } else if ( typeof page != "undefined" && isWriteMode ) {
                                    RDR.rindow.tagBox.setWidth( $rindow, 320 );
                                } else if ( tagList.length > 1 ) {
                                    if ( buckets.big.length ) { RDR.rindow.tagBox.setWidth( $rindow, 320 ); }
                                    if ( buckets.medium.length ) { RDR.rindow.tagBox.setWidth( $rindow, 320 ); }
                                    if ( buckets.small.length >= 3 ) { RDR.rindow.tagBox.setWidth( $rindow, 320 ); }
                                }
                            }

                            while ( buckets.big.length || buckets.medium.length || buckets.small.length ) {
                                if ( buckets.big.length ) {
                                  var thisTag = buckets.big.shift();
                                  RDR.rindow.tagBox.make( { tag: thisTag, boxSize: "big", $rindow:$rindow, isWriteMode:isWriteMode, colorInt:colorInt });
                                    // set next color 
                                    colorInt++;
                                    if ( colorInt == 6 ) colorInt = 1;
                                } else if ( buckets.medium.length ) {
                                    var thisTag = buckets.medium.shift();
                                    RDR.rindow.tagBox.make( { tag: thisTag, boxSize: "medium", $rindow:$rindow, isWriteMode:isWriteMode, colorInt:colorInt });
                                    // set next color 
                                    colorInt++;
                                    if ( colorInt == 6 ) colorInt = 1;
    
                                } else if ( buckets.small.length ) {
                                  var thisTag = buckets.small.shift();
                                  RDR.rindow.tagBox.make( { tag: thisTag, boxSize: "small", $rindow:$rindow, isWriteMode:isWriteMode, colorInt:colorInt });
                                  // set next color 
                                  colorInt++;
                                  if ( colorInt == 6 ) colorInt = 1;
                                }

                            }

                        } // writeTagBoxes

                        function isotopeTags( $tagsListContainer ) {
                        $tagsListContainer.isotope({
                          masonry: {
                            columnWidth: 160
                          }
                        }, function() {

                            var tagBoxesCount = $tagsListContainer.find('div.rdr_box').length,
                                currentTagBoxAnimating = 0;
                            var animationQueue = setInterval( function() { animateNextBox(); }, 20 );

                            function animateNextBox() {
                                var $thisBox = $tagsListContainer.find('div.rdr_box:eq('+currentTagBoxAnimating+')');
                                $thisBox.addClass('rdr_animated');
                                currentTagBoxAnimating++;
                                if ( currentTagBoxAnimating > tagBoxesCount ) {
                                    clearInterval( animationQueue );
                                }
                            }
                        });
                      } // isotopeTags

                        function isotopeFillGap($tagsListContainer){
                            var $boxes = $tagsListContainer.find('.rdr_box');
                            var $lastTag = $boxes.eq(-1);
                            
                            var $smallBoxes = $tagsListContainer.find('.rdr_box_small');
                            var $lastSmallTag = $smallBoxes.eq(-1);

                            if ( isTouchBrowser && $smallBoxes.length > 1 ) {
                                if ( $smallBoxes.index($lastTag) % 2 ==0 ) {
                                    $lastSmallTag.addClass('rdr_wide');
                                }
                                return;
                            }

                            if(!$lastTag.length || $boxes.length == 1){
                                return;
                            }

                            var lastTagDims = $lastTag.position();
                            var doBreak = false;

                            //force the position to fill the space.
                            $($boxes.get().reverse()).each(function(){
                                if(doBreak){
                                   return; 
                                }
                                
                                var $thisTag = $(this);
                                var thisTagDims = $thisTag.position();

                                var isLastTag = (thisTagDims.top == lastTagDims.top);
                                var isAdjacentRow = (thisTagDims.top == lastTagDims.top);
                                var isAdjacentCol = (thisTagDims.left == lastTagDims.left);

                                if(!isAdjacentRow && !isAdjacentCol){
                                    doBreak = true;
                                    return;
                                }
                                
                                if(isAdjacentRow){
                                    $thisTag
                                        .addClass('rdr_clear_transform')
                                        .css({
                                            height: 'auto',
                                            top: thisTagDims.top,
                                            left: thisTagDims.left,
                                            bottom: 0
                                        });  
                                }
                                //don't do this for now.
                                // if(isAdjacentCol){
                                //     $thisTag
                                //         .addClass('rdr_clear_transform')
                                //         .css({
                                //             width: 'auto',
                                //             top: thisTagDims.top,
                                //             left: thisTagDims.left,
                                //             right: 0
                                //         });   
                                // }

                            });
                            
                            $lastTag
                                .addClass('rdr_clear_transform')
                                .css({
                                    height: 'auto',
                                    width: 'auto',
                                    top: lastTagDims.top,
                                    left: (lastTagDims.left > 0 && lastTagDims.left < 160) ? 160:lastTagDims.left,
                                    bottom: 0,
                                    right: 0
                                });  
                        }

                    },
                    updateContainerTrackers: function(){
                        $.each( RDR.containers, function(idx, container) {
                            if ( container.kind && ( container.kind == "img" || container.kind == "media" || container.kind == "med") ) {
                                RDR.actions.indicators.utils.updateContainerTracker( container.hash );
                            }
                        });
                    },
                    updateContainerTracker: function(hash){
                        //RDR.actions.indicators.utils.updateContainerTracker:
                        var summary = RDR.summaries[hash],
                            $container = summary.$container,
                            $container_tracker = $('#rdr_container_tracker_'+hash);

                        //quick fix so this doesnt get run on text.
                        //TODO figure out where this was getting called for text containers.
                        var container = RDR.containers[hash];
                        if ( container.kind && ( container.kind == "text" || container.kind == "txt") ) return;

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

                        //compensate for padding - which we want to ignore
                        RDR.util.cssSuperImportant($container_tracker, {
                            top: $container.offset().top + paddingOffset.top+'px',
                            left: $container.offset().left + paddingOffset.left+'px'
                        }, true);

                        this.updateMediaTracker(hash);

                    },
                    updateInlineIndicator: function(hash){
                        //RDR.actions.indicators.utils.updateInlineIndicator:
                        var summary = RDR.summaries[hash],
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
                        //RDR.actions.indicators.utils.updateMediaTracker:
                        var summary = RDR.summaries[hash],
                            $container = summary.$container,
                            $indicator = summary.$indicator,
                            $indicator_body = summary.$indicator_body,
                            $indicator_details = summary.$indicator_details,
                            $container_tracker = $('#rdr_container_tracker_'+hash);

                        if ( $indicator_body ) {
                            
                            if ( $container.parents( RDR.group.img_container_selectors ).length ) {
                                $container = $container.parents( RDR.group.img_container_selectors ).first();
                            }

                            //todo: consolodate this with the other case of it
                            var containerWidth, containerHeight;
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

                            var padding = {
                                top: parseInt( $container.css('padding-top'), 10 ),
                                right: parseInt( $container.css('padding-right'), 10 ),
                                bottom: parseInt( $container.css('padding-bottom'), 10 ),
                                left: parseInt( $container.css('padding-left'), 10 )
                            };

                            var cornerPadding = 0,
                                indicatorBodyWidth = $indicator_body.width(),
                                modIEHeight = ( $.browser.msie && parseInt( $.browser.version, 10 ) < 9 ) ? 10:0;

                            var cssTop = (summary.kind=="media") ? $container.height()+modIEHeight+36:$container.height()+modIEHeight+12;
                            $indicator.data('top', cssTop);

                            if (summary.kind=="media") {
                                $indicator.addClass('rdr_indicator_not_img');
                            }

                            RDR.util.cssSuperImportant( $indicator, {
                                left: 12+'px',
                                top: cssTop+'px'
                            }, true);

                            var has_inline_indicator = (summary.kind=="text") ? false:true; //$container.data('inlineIndicator'); //boolean                        
                            if(has_inline_indicator){
                                RDR.actions.indicators.utils.updateInlineIndicator(hash);
                            }else{

                            }
                        }

                        // RDR.actions.indicators.utils.borderHilites.update(hash);
                    },
                    borderHilites: {
                        //RDR.actions.indicators.utils.borderHilites:
                        
                        //hiliteDesignEdit
                        //our old blue version
                        // designVersion: 1,

                        //black border and black box shadow fade
                        designVersion: 2,
                        

                        makeAttempt: 0, //this isn't really needed, just an extra failsave against an infinite loop that shouldn't happen.
                        make: function(hash){
                            //RDR.actions.indicators.utils.borderHilites.make:

                            var $indicator = $('#rdr_indicator_'+hash),
                                $container = $('[rdr-hash="'+hash+'"]'),
                                $container_tracker = $('#rdr_container_tracker_'+hash),
                                $mediaBorderWrap = $container_tracker.find('.rdr_media_border_wrap'); //probably null, will make it below.
                                                        
                            if( !$container_tracker.hasClass('rdr_inline_video') ){
                                
                                if( !$mediaBorderWrap.length ){
                                    $mediaBorderWrap = $('<div class="rdr_media_border_wrap" />').appendTo($container_tracker);
                                    $mediaBorderWrap.addClass('designVersion_' + RDR.actions.indicators.utils.borderHilites.designVersion);
                                }
                                $mediaBorderWrap.hide(); //start with it hidden.  It will fade in on hover

                                var borders = {
                                    'top': {
                                        $side: null,
                                        css: {}
                                    },
                                    'right': {
                                        $side: null,
                                        css: {}
                                    },
                                    'bottom': {
                                        $side: null,
                                        css: {}
                                    },
                                    'left': {
                                        $side: null,
                                        css: {}
                                    }
                                };

                                $mediaBorderWrap.data('borders',borders);
                                // RDR.actions.indicators.utils.borderHilites.update(hash);
                            }

                        },
                        update: function(hash){
                            //RDR.actions.indicators.utils.borderHilites.update:
                            // var Section = RDR.actions.indicators.utils.borderHilites;

                            // var $indicator = $('#rdr_indicator_'+hash),
                            //     $container = $('[rdr-hash="'+hash+'"]'),
                            //     $container_tracker = $('#rdr_container_tracker_'+hash),
                            //     $mediaBorderWrap = $container_tracker.find('.rdr_media_border_wrap');
                            
                            // if( !$mediaBorderWrap.length ){
                            //     //failsafe that shouldnt be needed.
                            //     if( this.makeAttempt > 1 ) return;
                            //     this.makeAttempt ++;
                            //     RDR.actions.indicators.utils.borderHilites.make(hash);
                            //     //just return here.  the make function will call this update function again and this will be bypassed.
                            //     return;
                            // }
                            // //else
                            // this.makeAttempt = 0;

                            // $mediaBorderWrap.hide(); //start with it hidden.  It will fade in on hover

                            // var borders = {
                            //     'top': {
                            //         $side: null,
                            //         css: {}
                            //     },
                            //     'right': {
                            //         $side: null,
                            //         css: {}
                            //     },
                            //     'bottom': {
                            //         $side: null,
                            //         css: {}
                            //     },
                            //     'left': {
                            //         $side: null,
                            //         css: {}
                            //     }
                            // };
                            
                            // //hiliteDesignEdit
                            // // var hiliteThickness = 2,
                            // var hiliteThickness = 
                            //     Section.designVersion === 1 ? 2 : 
                            //     Section.designVersion === 2 ? 3 : 
                            //     2;
                            
                            // var containerWidth,
                            //     containerHeight;

                            // var hasBorder = false;
                            // //for checking if it has a border.
                            // //If so we'll use outerWidth and outerHeight to take it into account.
                            // //If not, we use just the regular height and width so we'll ignore padding which would make the borderHilite look crappy.

                            // $.each( borders, function(side, data){
                            //     //set the value in the object using the key's string as a helper
                            //     var hiliteClass = 'rdr_mediaHilite_'+side; //i.e. rdr_mediaHilite_top
                      
                            //     data.$side = $mediaBorderWrap.find('.'+hiliteClass);
                            //     if( !data.$side.length ){
                            //         data.$side = $('<div />').addClass(hiliteClass).appendTo($mediaBorderWrap);
                            //     }

                            //     //if any side has a border - set hasBorder to true
                            //     if( parseInt( $container.css('border-'+side+'-width'), 10 ) ){
                            //         hasBorder = true;
                            //     }

                            // });
                            
                            // //figure out dims
                            // if(hasBorder){
                            //     containerWidth = $container.outerWidth();
                            //     containerHeight = $container.outerHeight();
                            // }else{
                            //     containerWidth = $container.width();
                            //     containerHeight = $container.height();
                            // }

                            // //use dims to make the css rules for each border side
                            // var widthCap = 2*hiliteThickness;

                            // borders.top.css = {
                            //     width: containerWidth+widthCap+'px',
                            //     height: 0+'px',
                            //     top: -hiliteThickness+'px',
                            //     left: -hiliteThickness+'px'
                            // };
                            // borders.right.css = {
                            //     width:0+'px',
                            //     height: containerHeight+'px',
                            //     top: 0+'px',
                            //     left: containerWidth+'px'
                            // };
                            // borders.bottom.css = {
                            //     width: containerWidth+widthCap+'px',
                            //     height: 0+'px',
                            //     top: containerHeight+'px',
                            //     left: -hiliteThickness+'px'
                            // };
                            // borders.left.css = {
                            //     width: 0+'px',
                            //     height: containerHeight+'px',
                            //     top: 0+'px',
                            //     left: -hiliteThickness+'px'
                            // };

                            // $.each( borders, function( side, data ){
                            //     RDR.util.cssSuperImportant( data.$side, data.css, true );
                            // });                       
                    
                        },
                        engage: function(hash, isShareLink){
                            //RDR.actions.indicators.utils.borderHilites.engage:
                            var $container_tracker = $('#rdr_container_tracker_'+hash),
                                $mediaBorderWrap = $container_tracker.find('.rdr_media_border_wrap');

                            $mediaBorderWrap.addClass('engaged');
                            
                            if (isShareLink) {
                                $mediaBorderWrap.addClass('engagedForShareLink');
                            }
                        },
                        disengage: function(hash){
                            //RDR.actions.indicators.utils.borderHilites.disengage:
                            // if ( !$('rdr_for_'+hash).length ) {
                                var $container_tracker = $('#rdr_container_tracker_'+hash),
                                    $mediaBorderWrap = $container_tracker.find('.rdr_media_border_wrap');

                                $mediaBorderWrap.removeClass('engaged');
                                $mediaBorderWrap.removeClass('engagedForShareLink');
                                $('#rdr_indicator_' + hash).hide();
                            // }
                        },
                        engageAll: function(){
                            //RDR.actions.indicators.utils.borderHilites.engageAll:
                            $mediaBorderWrap = $('.rdr_media_border_wrap');
                            $mediaBorderWrap.addClass('engaged');
                        },
                        disengageAll: function(){
                            //RDR.actions.indicators.utils.borderHilites.disengageAll:
                            $mediaBorderWrap = $('.rdr_media_border_wrap');
                            $mediaBorderWrap.removeClass('engaged');
                            $mediaBorderWrap.removeClass('engagedForShareLink');
                            $('div.rdr_indicator_for_media').hide();
                        }
                    }
                }//end RDR.actions.indicators.utils
            },
            summaries:{
                init: function(hash){
                    //RDR.actions.summaries.init:

                    if ( typeof RDR.summaries[hash] == 'object' ) {
                        return RDR.summaries[hash];
                    }

                    //todo: it might make sense to just get this from the backend, since it has a function to do this already.

                    //data is in form {body:,kind:,hash:}
                    //todo: combine with above
                    var container = RDR.containers[hash];

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
                    //RDR.actions.summaries.save:
                    var hash = summary.hash;

                    //save the summary and add the $container as a property
                    RDR.summaries[hash] = summary;
                    summary.$container = $('[rdr-hash="'+hash+'"]');

                    // RDR.actions.summaries.sortInteractions(hash);

                },
                update: function(hash, diff, isPage, pageId){
                    //RDR.actions.summaries.update:
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
                                RDR.actions.summaries.updatePageSummaryTags(hash, diffNode);
                            });
                        });
                        return;
                    }
                    //else, not a page

                    //get summary, or if it doesn't exist, get a zero'ed out template of one.

                    //todo: use a try catch instead;
                    var summary;
                    if( !RDR.summaries.hasOwnProperty(hash) ){
                        summary = RDR.actions.summaries.init(hash);
                    }else{
                        summary = RDR.summaries[hash];
                    }

                    //todo: not sure if this is being used. - no it's not being used yet.  never got to it.
                    // if( hash == "pageSummary" ){
                        //waaaiatt a minute... this isn't a hash.  Page level,...Ugly...todo: make not ugly
                        // summary = RDR.util.getPageProperty ('summary');
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
                            //now update rindow
                            RDR.rindow.update(hash, diffNode);

                        });

                    });

                    //don't forget to do this.  Tags won't get built correctly if not updated.
                    RDR.actions.summaries.sortInteractions(hash);
                    
                    if( hash == "pageSummary" ){
                        //waaaiatt a minute... this isn't a hash.  Page level,...Ugly...todo: make not ugly
                        makeSummaryWidget(RDR.page);
                    }else{
                        //only init if it's a text node, don't do it for media.
                        // var shouldReInit = (summary.kind == 'text');
                        // RDR.actions.indicators.update( hash, shouldReInit );
                    }
                                
                    function update_top_interactions_cache(attrs){
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
                                RDR.actions.summaries.updatePageSummaryTags(hash, diffNode);
                                
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
                                RDR.actions.summaries.updatePageSummaryTags(hash, diffNode);

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
                    //RDR.actions.summaries.updatePageSummaryTags:

                        //also update page
                        var tagId = diffNode.id;
                        var pageId = diffNode.page_id || RDR.util.getPageProperty('id', hash);
                        var page = RDR.pages[pageId];
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


                        var $page = $('[rdr-page-container="'+pageId+'"]'); 
                        //update plugin widgets
                        //update rdrWidgetSummary...
                        var $summaryWidgetAnchorNode = $page.find('[rdr-page-widget-key]');
                        $summaryWidgetAnchorNode.rdrWidgetSummary('update');
                    
                },

                sortByTags: function(tags) {
                  // RDR.actions.summaries.sortByTags
                  
                  //redundant with below.  
                  //I need to use this for page summaries and dont want to mess with the below func.
                  function SortByTagCount(a,b) { return b.tag_count - a.tag_count; }
                  return tags.sort( SortByTagCount );
                },

                sortInteractions: function(hash) {
                    // RDR.actions.summaries.sortInteractions

                    function SortByTagCount(a,b) { return b.tag_count - a.tag_count; }

                    var summary = RDR.summaries[hash];
                    summary.interaction_order = [];
                    summary.counts.highest_tag_count = 0;

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
                        // has no content node obj?  i.e. is text that is probably a rdr-item.
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
                    // RDR.actions.summaries.sortPopularTextContainers
                    // only sort the most popular whitelisted
                    // is this used??
                    function SortByCount(a,b) { return b.interactions - a.interactions; }

                    RDR.text_container_popularity = [];

                    $.each( RDR.summaries, function( hash, container ){
                        if ( container.kind == "text" && container.counts.interactions > 0 ) {
                            RDR.text_container_popularity.push( { hash:hash, interactions:container.counts.interactions } );
                        }
                    });

                    RDR.text_container_popularity.sort( SortByCount );

                },
                displayPopularIndicators: function () {
                    // RDR.actions.summaries.displayPopularIndicators
                    // is this used??

                    for ( var i=0; i < RDR.group.initial_pin_limit; i++) {
                        if ( RDR.text_container_popularity[i] ) $('#rdr_indicator_' + RDR.text_container_popularity[i].hash).removeClass('rdr_dont_show');
                    }
                },
                showLessPopularIndicators: function() {
                    // RDR.actions.summaries.showLessPopularIndicators
                    // is this used??
                    var hashesToShow = [];

                    for ( var i=RDR.group.initial_pin_limit; i<RDR.text_container_popularity.length; i++) {
                        if ( RDR.text_container_popularity[i] ) {
                            if ( RDR.text_container_popularity[i].interactions > 0 ) {
                                $('#rdr_indicator_' + RDR.text_container_popularity[i].hash).removeClass('rdr_dont_show');
                                hashesToShow.push( RDR.text_container_popularity[i].hash );
                            }
                        }
                    }

                    RDR.actions.indicators.show(hashesToShow);
                }
            },
            insertContainerIcon: function( hash ) {},
            viewReactionSuccess: function(args) {
                //RDR.actions.viewReactionSuccess

                var tag = args.tag,
                    $rindow = args.rindow,
                    interaction = args.response.data.interaction,
                    content_node = ( args.content_node == "" ) ? args.response.data.content_node:args.content_node;

                $rindow.removeClass('rdr_rewritable').addClass('rdr_viewing_more').find('.rdr_footer').hide();
                //temp tie-over
                var headerText = ( args.scenario == "reactionSuccess" ) ? "Thanks for your reaction!":"You've already reacted to this";

                var isPage = args.kind == "page";
                if(isPage){
                    var hash = null,
                        kind = "page";
                }else{
                    var hash = args.hash,
                        summary = RDR.summaries[hash],
                        kind = summary.kind; // text, img, media
                }


                // do stuff, populate the rindow.
                var $header = RDR.rindow.makeHeader( headerText, args.response.data.interaction.id);
                $rindow.find('.rdr_header').replaceWith($header);

                var $newPanel = RDR.rindow.panelCreate( $rindow, 'rdr_view_more' );
                var $rdr_body_wrap = $rindow.find('div.rdr_body_wrap');
                $rdr_body_wrap.append( $newPanel );

                RDR.rindow.updateTagMessage( args );

                // var isMediaContainer = kind=="img" ||
                //     kind=="image" ||  // [pb] really?
                //     kind=="imgage" ||
                //     kind=="med" ||
                //     kind=="media";

                RDR.rindow.panelShow( $rindow, $newPanel, function() {
                  
                    if ( kind == "text" && args.selState ){
                        var selState = args.selState;
                        $().selog('hilite', selState, 'on');
                    }

                    var $tagsListContainer = RDR.actions.indicators.utils.makeTagsListForInline( $rindow );
                    
                    // for crossPageHashes only - will do nothing if it's not a crosspagehash
                    if (args.scenario != "reactionExists") {
                        RDR.actions.containers.updateCrossPageHash(hash);
                    }

                    $tagsListContainer.addClass('rdr_hiddenPanel');
                    var className = "rdr_tags_list";
                    RDR.rindow.hideFooter($rindow);
                    RDR.rindow.panelUpdate($rindow, className, $tagsListContainer);
                    
                    var isCrossPageContainer = $('[rdr-hash="'+hash+'"]').length > 0;
                    if(!isCrossPageContainer){
                        //dont do this for crossPageContainers - it was messing shit up.
                        // RDR.rindow.panelEnsureFloatWidths($rindow);
                    }

                } );
                
                //todo: examine resize
                // RDR.rindow.updateSizes( $rindow );

                // RDR.events.track( 'view_reaction_success::'+interaction.id+'|'+tag.id, hash );
            },
            viewCommentContent: function(args){
                //RDR.actions.viewCommentContent
                var tag = args.tag,
                    $rindow = args.rindow,
                    content_node = args.content_node;

                RDR.events.trackEventToCloud({
                    event_type: "vcom",
                    event_value: '',
                    container_hash: args.hash,
                    container_kind: args.content_node.kind,
                    page_id: RDR.util.getPageProperty('id'),
                    reaction_body: args.tag.tag_body
                });

                $rindow.removeClass('rdr_rewritable').addClass('rdr_viewing_more');
                RDR.rindow.tagBox.setWidth( $rindow, 320 );
                RDR.rindow.hideFooter( $rindow );

                //temp tie-over
                var hash = args.hash,
                    summary = RDR.summaries[hash],
                    tagBody = (tag.tag_body) ? tag.tag_body:tag.body,
                    kind = summary.kind; // text, img, media

                // do stuff, populate the rindow.
                var $header = RDR.rindow.makeHeader( tag.tag_body );
                $rindow.find('.rdr_header').replaceWith($header);

                var $newPanel = RDR.rindow.panelCreate( $rindow, 'rdr_view_more' );
                var $rdr_body_wrap = $rindow.find('div.rdr_body_wrap');
                $rdr_body_wrap.append( $newPanel );


                var $commentsWrap = $('<div class="rdr_commentsWrap"></div>');
                var $backButton = _makeBackButton();
                var $backButton2 = _makeBackButton();
                var $otherComments = _makeOtherComments();
                var $commentBox = _makeCommentBox();
                $commentsWrap.append($backButton, $otherComments, $commentBox, $backButton2);

                $newPanel.append($commentsWrap);

                var isMediaContainer = kind=="img" ||
                    kind=="imgage" ||
                    kind=="med" ||
                    kind=="media";

                //todo: examine resize
                // RDR.rindow.updateSizes( $rindow );
                RDR.rindow.panelShow( $rindow, $newPanel, function() {
                    if ( kind == "text" ){
                        var selState = args.selState || summary.content_nodes[ content_node.id ].selState;
                        $().selog('hilite', selState, 'on');
                        $rindow.data('selState', selState);
                    }
                });

                // RDR.events.track( 'view_comment::'+content_node.id+'|'+tag.id, hash );

                //helper functions
                function _makeCommentBox() {

                    var $commentBox = $('<div class="rdr_commentBox rdr_innerWrap"></div>').html(
                        '<div class="rdr_commentComplete"><div><h4>Leave a comment:</h4></div></div>'
                    );
                   //todo: combine this with the other make comments code
                    var helpText = "Add a comment or #hashtag",
                        $commentDiv =  $('<div class="rdr_comment rdr_clearfix">'),
                        $commentTextarea = $('<textarea class="commentTextArea rdr_default_msg">' +helpText+ '</textarea>'),
                        $rdr_charCount =  $('<div class="rdr_charCount">'+RDR.group.comment_length+' characters left</div>'),
                        $submitButton =  $('<button class="rdr_commentSubmit">Comment</button>');

                    $commentDiv.append( $commentTextarea, $rdr_charCount, $submitButton );

                    $commentTextarea.focus(function(){
                        // RDR.events.track('start_comment_lg::'+content_node.id+'|'+tag.id);
                        if( $(this).val() == helpText ){
                            $(this).val('');
                        }

                    // todo: consolodate with similar functions.
                    }).blur(function(){
                        var val = $(this).val();
                        if( val === "" || val === helpText ){
                            $(this).addClass('rdr_default_msg');
                            $(this).val( helpText );
                        }
                    }).keyup(function(event) {
                        var commentText = $commentTextarea.val();
                        if (event.keyCode == '27') { //esc
                            $(this).blur();
                            // return false so the rindow doesn't close.
                            return false;
                        } else if ( commentText.length > RDR.group.comment_length ) {
                            commentText = commentText.substr(0, RDR.group.comment_length);
                            $commentTextarea.val( commentText );
                        }
                        $commentTextarea.siblings('div.rdr_charCount').text( ( RDR.group.comment_length - commentText.length ) + " characters left" );
                    });

                    $submitButton.click(function(e) {
                        var commentText = $commentTextarea.val();
                        //keyup doesn't guarentee this, so check again (they could paste in for example);
                        if ( commentText.length > RDR.group.comment_length ) {
                            commentText = commentText.substr(0, RDR.group.comment_length);
                            $commentTextarea.val( commentText );
                            $commentTextarea.siblings('div.rdr_charCount').text( ( RDR.group.comment_length - commentText.length ) + " characters left" );
                        }

                        if ( commentText != helpText ) {
                            //temp translations..
                            //quick fix.  images don't get the data all passed through to here correctly.
                            //could try to really fix, but hey.  we're rewriting soon, so using this hack for now.

                            if ($.isEmptyObject(content_node) && summary.kind=="img") {
                                content_node = {
                                    "body":$('img[rdr-hash="'+summary.hash+'"]').get(0).src,
                                    "kind":summary.kind,
                                    "hash":summary.hash
                                };
                            } else {
                                // more kludginess.  how did this sometimes get set to "txt" and sometimes "text"
                                // see if this is a custom display type
                                // if so, use that info to set the kind
                                // i know, this looks bad, is duplicated elsewhere, and looks overlappng with the code in the if() right above
                                var $node = $('[rdr-hash="'+summary.hash+'"]'),
                                    content_type = $node.attr('rdr-content-type');

                                if ( content_type ) {
                                    if (content_type == "media") { content_node.kind = "media"; }
                                    else if (content_type == "image") { content_node.kind = "image"; }
                                    else { content_node.kind = "text"; }
                                } else {
                                    content_node.kind = "text";
                                }
                            }
                            var selState = selState || null;
                            var args = {  hash:hash, content_node_data:content_node, comment:commentText, content:content_node.body, tag:tag, rindow:$rindow, selState:selState};

                            //leave parent_id undefined for now - backend will find it.
                            RDR.actions.interactions.ajax( args, 'comment', 'create');

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
                    var $backButton = $('<div class="rdr_back">Close X</div>');
                    $backButton.click( function() {
    
                        //temp fix because the rindow scrollpane re-init isnt working
                        var isViewForRindow = !!$rindow.attr('rdr-view-reactions-for');
                        if(!isViewForRindow){
                            RDR.rindow.close($rindow);
                            return;
                        }

                        var $header = RDR.rindow.makeHeader( 'Reactions' );
                        $rindow.find('.rdr_header').replaceWith($header)
                        RDR.rindow.updateTagPanel( $rindow );
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
                    var $otherComments = $('<div class="rdr_otherCommentsBox"></div>');
                    var $header = $('<div class="rdr_comment_header rdr_innerWrap"><h4>(<span>' + node_comments + '</span>) Comments:</h4></div>');
                    $otherComments.append($header);

                    $.each(comments, function(idx, this_comment){
                        if( this_comment.tag_id != tagId ){
                            return;
                        }

                        $otherComments.show();

                        var $commentSet = $('<div class="rdr_commentSet rdr_innerWrap" />'),
                            $commentBy = $('<div class="rdr_commentBy" />'),
                            $comment = $('<div class="rdr_comment" />'),
                            $commentReplies = $('<div class="rdr_commentReplies" />'),
                            $commentReply = $('<div class="rdr_commentReply" />'),
                            $commentReply_link = $('<a href="javascript:void(0);">Reply</a>');

                        var user_image_url = ( this_comment && this_comment.social_user && this_comment.social_user.img_url ) ? this_comment.social_user.img_url: RDR_staticUrl+'widget/images/anonymousplode.png';

                        var user_name = ( !this_comment || !this_comment.user || this_comment.user.first_name === "" ) ? 
                            "Anonymous" : 
                            this_comment.user.first_name + " " + this_comment.user.last_name;
                        
                        $commentBy.html(
                            '<a href="'+RDR_baseUrl+'/user/'+this_comment.user.id+'" target="_blank"><img src="'+user_image_url+'" class="no-rdr" /> ' + user_name + '</a>'
                        ).click( function() {
                            // RDR.events.track('click_user_profile');
                        });

                        $comment.html(
                            // '<span class="rdr_quoteImg"></span>'+
                            '<div class="rdr_comment_body">'+this_comment.body+'</div>'
                        );

                        $commentSet.append( $commentBy, $comment ); // , $commentReplies, $commentReply
                        $otherComments.append( $commentSet );

                    });

                    $otherComments.find('div.rdr_commentSet:last-child').addClass('rdr_lastchild');
                    return $otherComments;

                } //end makeOtherComments
            },
            share_getLink: function(args) {
                var hash = args.hash,
                    summary = RDR.summaries[hash],
                    kind = (args.kind) ? args.kind:summary.kind;

                //example:
                //tag:{body, id}, rindow:rindow, settings:settings, callback:

                // tag can be an ID or a string.  if a string, we need to sanitize.

                // tag, rindow, settings, callback

                // TODO the args & params thing here is confusing
                RDR.session.getUser( args, function( params ) {
                    // get the text that was highlighted

                    // var content = $.trim( params.settings.content ),
                    //     container = $.trim( params.settings.container ),
                    //     src_with_path = $.trim( params.settings.src_with_path );

                    var rindow = params.rindow,
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

                    var content_node = RDR.actions.content_nodes.make(content_node_data);

                    // TODO SHARE HACK REMOVE THIS DAILYCANDY ONLY
                    // if ( window.location.hash.length > 1 ) {
                        $.postMessage(
                            "page_hash|"+window.location.hash,
                            RDR_baseUrl + "/static/xdm.html",
                            window.frames['rdr-xdm-hidden']
                        );
                    // }

                    if ( typeof tag.body == "undefined" ) {
                        tag.body = tag.tag_body;
                    }
                    var sendData = {
                        "tag" : tag,
                        "hash": content_node_info.hash,
                        "content_node_data" : content_node_data,
                        "user_id" : RDR.user.user_id,
                        "readr_token" : RDR.user.readr_token,
                        "group_id" : RDR.group.id,
                        "page_id" : RDR.util.getPageProperty('id', hash),
                        "referring_int_id" : args.referring_int_id,
                        "container_kind" : (args.kind=="page") ? "page":RDR.summaries[hash].kind  // TODO: a container kind of page should be handled better
                    };

                        // send the data!
                        $.ajax({
                            url: RDR_baseUrl+"/api/share/",
                            type: "get",
                            contentType: "application/json",
                            dataType: "jsonp",
                            data: { json: $.toJSON(sendData) },
                            success: function(response) {
                                // todo cache the short url
                                // RDR.summaries[content_node_info.hash].content_nodes[IDX].top_interactions.tags[tag.id].short_url = ;
                                args.response = response;

                                if ( response.status == "fail" ) {
                                    if ( response.message.indexOf( "Temporary user interaction limit reached" ) != -1 ) {
                                        RDR.session.showLoginPanel( args );
                                    } else {
                                        // if it failed, see if we can fix it, and if so, try this function one more time
                                        RDR.session.handleGetUserFail( args, function() {
                                            RDR.actions.share_getLink( args );
                                        });
                                    }
                                } else {
                                    //successfully got a short URL
                                    RDR.actions.shareContent({
                                        sns: params.sns,
                                        content_node_info: content_node_info,
                                        short_url: response.data.short_url,
                                        reaction: tag.body,
                                        //the content_node_info kind was un-reliable. - use this instead
                                        container_kind: (hash == "page") ? "page" : RDR.summaries[hash].kind
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
                        var footerShareText = "A ReadrBoard Reaction on " + groupName;

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
                                if(RDR_offline){
                                    content = content.replace("local.readrboard.com:8081", "www.readrboard.com");
                                    content = content.replace("localhost:8081", "www.readrboard.com");
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
                        var footerShareText = "A ReadrBoard Reaction on " + groupName;
                        var twitter_acct = ( RDR.group.twitter ) ? '&via='+RDR.group.twitter : '';

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

                    case "tumblr":
                        
                        var mainShareText = "";

                        switch ( args.container_kind ) {
                            case "txt":
                            case "text":
                                //tumblr adds quotes for us - don't pass true to quote it.
                                var footerShareText = _wrapTag(args.reaction, true) +
                                    '&nbsp;[a <a href="'+args.short_url+'">quote</a> on '+groupName+' via ReadrBoard]';
                                
                                content_length = 300;
                                contentStr = _shortenContentIfNeeded(content, content_length);
                                share_url = 'http://www.tumblr.com/share/quote?'+
                                'quote='+encodeURIComponent(contentStr)+
                                '&source='+encodeURIComponent(footerShareText);

                            break;

                            case "img":
                            case "image":
                                                            //for testing offline
                                if(RDR_offline){
                                    content = content.replace("local.readrboard.com:8081", "www.readrboard.com");
                                    content = content.replace("localhost:8081", "www.readrboard.com");
                                }

                                mainShareText = _wrapTag(args.reaction, true);

                                var footerShareText = '&nbsp;[a <a href="'+args.short_url+'">picture</a> on '+groupName+' via ReadrBoard]';

                                share_url = 'http://www.tumblr.com/share/photo?'+
                                    'source='+encodeURIComponent(content)+
                                    '&caption='+encodeURIComponent(mainShareText + footerShareText )+
                                    '&click_thru='+encodeURIComponent(args.short_url);
                            break;

                            case "media":
                            case "med":
                            case "video":
                                //todo: - I haven't gone back to try this yet...

                                //note that the &u= doesnt work here - gives a tumblr page saying "update bookmarklet"
                                var iframeString = '<iframe src=" '+args.content_node_info.body+' "></iframe>';

                                mainShareText = _wrapTag(args.reaction, true);

                                var footerShareText = '&nbsp;[a <a href="'+args.short_url+'">video</a> on '+groupName+' via ReadrBoard]';

                                //todo: get the urlencode right and put the link back in
                                var readrLink = mainShareText + footerShareText;
                                share_url = 'http://www.tumblr.com/share/video?&embed='+encodeURIComponent( iframeString )+'&caption='+encodeURIComponent( readrLink );
                            break;

                            case "page":
                                var footerShareText = _wrapTag(args.reaction, true) +
                                    '&nbsp;[an <a href="'+args.short_url+'">article</a> on '+groupName+' via ReadrBoard]';
                                
                                content_length = 300;
                                contentStr = _shortenContentIfNeeded(content, content_length);
                                share_url = 'http://www.tumblr.com/share/link?'+
                                'url='+encodeURIComponent(args.short_url)+
                                '&description='+encodeURIComponent(footerShareText);

                            break;

                        }
                    break;

                    case "linkedin":
                    break;
                }
                if ( share_url !== "" ) {
                    if ( RDR.shareWindow ) {
                        RDR.shareWindow.location = share_url;
                    }
                }else{
                    if ( RDR.shareWindow ) {
                        RDR.shareWindow.close();
                    }
                }

                function _getGroupName(){
                    //consider using RDR.group.name
                    //todo: make this smarter - check for www. only in start of domain
                    return RDR.group.name ?
                        RDR.group.name :
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
                //RDR.actions.newUpdateData:
                //not using this yet...
                var summary = RDR.summaries[hash],
                    $rindow_readmode = summary.$rindow_readmode,
                    $rindow_writemode = summary.$rindow_writemode;
            },
            startSelect: function($mouse_target, mouseEvent, callback) {
                //RDR.actions.startSelect:
                // make a jQuery object of the node the user clicked on (at point of mouse up)
                // if this is a node with its own, separate call-to-action, don't do a custom new selection.
                if ( $mouse_target.hasAttr('rdr-item') && $('[rdr-cta-for="'+$mouse_target.attr('rdr-item')+'"]').length ) { 
                    return; 
                }

                //destroy all other actionbars
                RDR.actionbar.closeAll();
                var maxChars = 800;

                // make sure it's not selecting inside the RDR windows.
                // todo: (the rdr_indicator is an expection.
                // The way we're dealing with this is a little weird.  It works, but could be cleaner)
                if ( $mouse_target.closest('.rdr, .no-rdr, #rdr_sandbox').length && !$mouse_target.closest('.rdr_indicator').length ) return;
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

                $rdrParent = $blockParent.closest('[rdr-hashed]');
            
                //let selog use serialrange to check if the selected text is contained in the $blockParent (also check for "" of just whitespace)
                var selected = $blockParent.selog('save');
                if ( !selected || !selected.serialRange || !selected.text || (/^\s*$/g.test(selected.text)) ) return;
                //else

                //don't send text that's too long - mostly so that the ajax won't choke.
                if(selected.text.length > maxChars) return;

                var kind = 'text';
                var content = selected.text;

                // check if the blockparent is already hashed
                if ( $rdrParent.length && $rdrParent.hasAttr('rdr-hashed') && !$rdrParent.hasAttr('rdr-page-container') ) {
                    if(callback){
                        var hash = $rdrParent.data('hash')
                        callback(hash, kind, content);
                        return;
                    }
                    return _drawActionBar($rdrParent);
                }
                else{
                    //hasn't been hashed yet.
                    //try to submit node to server.  Draw the actionbar using an onsuccess function so we don't draw it if it fails.
                    //note: hashes in this case will just be a single hash. That's cool.
                    
                    //todo: use our new sendHashesForSinglePage function after testing and refactoring.
                    var hashListForPage = RDR.actions.hashNodes( $blockParent );

                    if(hashListForPage){
                        RDR.actions.sendHashes( hashListForPage, function(){
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
                        summary = RDR.summaries[hash] || 'undefined';

                    if ( _writeModeOpenForThisContainer(hash) ) return false;
                    //else

                    if ( summary != 'undefined') {
                        var $indicator = summary.$indicator;
                        RDR.actions.indicators.helpers.out($indicator);
                    }
                    // closes undragged windows
                    //close with our own event instead of removing directly so that I can bind an event to the remove event (thanks ie.)
                    RDR.rindow.close( $('div.rdr.rdr_window.rdr.rdr_rewritable') );

                    var actionbarCoords = mouseEvent ? {
                        top: parseInt(mouseEvent.pageY, 10),
                        left: parseInt(mouseEvent.pageX, 10)
                    } : {
                        top: $mouse_target.offset().top,
                        left: $mouse_target.offset().left
                    };

                    return RDR.actionbar.draw({
                        coords:actionbarCoords,
                        kind:"text",
                        content:selected.text,
                        hash:$blockParent.data('hash')
                    });

                }
                function _writeModeOpenForThisContainer(hash){

                    /*todo: quick fix - check for other writemode rindows for this container that are already open.*/
                    /*
                    if it has a summary, check for a rindow.
                    Of course, if it's brand new, it won't have a summary, but then it wont have a rindow either
                    */
                    var summary = RDR.summaries[hash] || 'undefined';
                    if( !summary ) return false;
                    //only allow one writemode per container at a time, check for writemode rindow.
                    var $rindow_writemode = summary.$rindow_writemode;
                    if( $rindow_writemode && $rindow_writemode.filter(":visible").length ){
                        return $rindow_writemode;
                    }else{
                        return false;
                    }
                }
                function _isValid($node){
                    var validity = ( ( $node.css('display') == "block" || $node.css('display') == "list-item" ) &&
                        // $node.css('float') == "none" &&
                        ! $node.closest('.rdr_indicator').length &&
                        ! $node.is('html, body')
                    );
                    return validity;
                }
            },
            startSelectFromMouseUp: function(e) {
                //RDR.actions.startSelectFromMouseUp
                var $mouse_target = $(e.target);
                RDR.actions.startSelect($mouse_target, e);
            },
            stripRdrNode: function($els) {
                //RDR.actions.stripRdrNode
                $els.removeAttr('rdr-node rdr-hasIndicator rdr-hashed rdr_summary_loaded rdr-hash').find('.rdr_indicator').remove();
            },
            pages: {
                //RDR.actions.pages:
                save: function(id, page){
                    //RDR.actions.pages.save:
                    RDR.pages[page.id] = page;
                },
                initPageContainer: function(pageId){
                    // RDR.actions.pages.initPageContainer

                    var page = RDR.pages[pageId],
                        key = page.urlhash; //todo: consider phasing out - use id instead
                        // key = page.key; //todo: consider phasing out - use id instead   

                    var $container = ( $(RDR.group.post_selector + '[rdr-page-key="'+key+'"]').length == 1 ) ? $(RDR.group.post_selector + '[rdr-page-key="'+key+'"]'):$('body[rdr-page-key="'+key+'"]');

                    if ( $container.length !== 1 ) return;
                    //else
                    $container.removeAttr( 'rdr-page-key' );
                    $container.attr( 'rdr-page-container' , pageId );

                    //todo: [eric] this can't be right - we shouldn't just hash a single number like '1'.
                    var hash = RDR.util.md5.hex_md5( String(page.id) );
                    var tagName = $container.get(0).nodeName.toLowerCase();  //todo: looks like we're not using this for pages?

                    RDR.actions.containers.save({
                        id: String(page.id),
                        kind: "page",
                        hash: hash,
                        HTMLkind: null
                    });

                    $container.data( 'page_id', String(page.id) ); // the page ID

                    // hash the "page" descendant nodes
                    // RDR.actions.hashNodes( $container, "nomedia" );

                    //todo: can't we use the hashes returned by this function instead?

                    // is the post_selector the same node as the active_section?
                    // determined by seeing if the active_section exists, just not inside the post_selector
                    if ( RDR.group.post_selector && !$(RDR.group.post_selector).first().find(RDR.group.active_sections).length && $(RDR.group.active_sections).length ) {
                        // RDR.group.active_sections = '';
                        // active_sections_with_anno_whitelist = RDR.group.anno_whitelist;
                        RDR.actions.hashNodes( $container.parent() );
                    } else {
                        RDR.actions.hashNodes( $container );
                    }

                    var hashesByPageId = {};
                    if ( page.containers.length > 0 ) {
                        hashesByPageId[ page.id ] = [];
                        $.each( page.containers, function(idx, container) {
                            if ( typeof container.hash != "undefined") {
                                hashesByPageId[ page.id ].push( container.hash );
                            }
                        });

                        // RDR.actions.sendHashes( hashesByPageId );
                    // } else if ( page && $('[rdr-crossPageContent="true"]').length ) {
                    }

                    if ( page && $container.find('[rdr-item]').length ) {
                        // [pb] should this be $('[rdr-item]') instead of crossPageContent??
                        // [pb] 10/2013: methinks yes, b/c we want to ensure a custom display is visible. 
                        //               see comment right below:

                        // if no reactions on this page, but there is a cross-page container... force a call.  
                        //    // just grab the first crosspage hash.. we get them all later.  
                        //    // not exactly pretty, but i don't want to grab them all, b/c later we get them all and then also remove cross-page ones from the
                        //    // known_hash list, to prevent some duplication.
                        // var hashesByPageId = {};
                        hashesByPageId[ page.id ] = hashesByPageId[ page.id ] || [];

                        // should we find custom-display nodes and add to the hashList here?
                        $.each( $container.find('[rdr-item]'), function( idx, node ) {
                            RDR.actions.hashNodes( $(node) );
                            var thisHash = $(node).attr('rdr-hash');

                            if (typeof thisHash != 'undefined') {
                                hashesByPageId[ page.id ].push( thisHash );
                            }
                        });
                        // hashesByPageId[ page.id ].push( $('[rdr-item="true"]:eq(0)').attr('rdr-hash') );
                        // RDR.actions.sendHashes( hashesByPageId );
                    }

                    RDR.actions.sendHashes( hashesByPageId );

                    //init the widgetSummary
                    var widgetSummarySettings = page;

                    widgetSummarySettings.key = key;
                    
                    if ( $container.find( RDR.group.summary_widget_selector).length == 1 && $container.find( RDR.group.summary_widget_selector+'[rdr-page-widget-key="' + key + '"]') ) {
                        widgetSummarySettings.$anchor = $container.find(RDR.group.summary_widget_selector).eq(0);
                        
                    } else if( $(".rdr-page-summary").length==1 ){
                        widgetSummarySettings.$anchor = $(".rdr-page-summary").eq(0); //change to group.summaryWidgetAnchorNode or whatever
                    }else{
                        //use the default summaryBar instead
                        // do NOT set the bottom to -1000px -- that's because the widget CSS sets a TOP value... so a TOP of 0 still displays the summary bar, and makes it cover the whole page (since it is stretched to -1000px below bottom to boot)
                        var displayDefaultBar = ( typeof RDR.engageScriptParams.bookmarklet == "undefined" ) ? "top:-1000px !important":"";
                        widgetSummarySettings.$anchor = $('<div id="rdr-page-summary" class="rdr no-rdr rdr-page-summary defaultSummaryBar" style="'+displayDefaultBar+'"/>');
                        widgetSummarySettings.$anchor.appendTo('body');
                    }
                    
                    //div to hold summary tag detail "menus"
                    $('#rdr_sandbox').append('<div id="rdr_summary_tag_details" />');
                    
                    //setup widgetSummary
                    if ( ($('div.rdr-summary').length===0) || ( $('div.rdr-summary').length < $(RDR.group.post_selector).length ) ) {
                        widgetSummarySettings.$anchor.rdrWidgetSummary(widgetSummarySettings);
                    }

                }
            },
            users: {
                //RDR.actions.users:
                save: function(id, settings){
                    //RDR.actions.users.save:

                }
            }
        }//end RDR.actions
    });
}


//from http://www.aaronpeters.nl/blog/prevent-double-callback-execution-in-IE9#comment-175618750
function rdr_loadScript(attributes, callbackfunction) {
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

//add to RDR for use later.
RDR.rdr_loadScript = rdr_loadScript;

//load jQuery overwriting the client's jquery, create our $R clone, and revert the client's jquery back
RDR_scriptPaths.jquery = RDR_offline ?
    RDR_staticUrl+"global/js/jquery-1.10.2.min.js" :
    // RDR_staticUrl+"global/js/jquery-1.7.1.min.js" :
    // "http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js";
    "//cdnjs.cloudflare.com/ajax/libs/jquery/1.10.2/jquery.min.js";

// dont think we use this -- we embedded it below.
// RDR_scriptPaths.mobileEvents = RDR_staticUrl+"global/js/jquery.mobile-events.js";

// RDR_scriptPaths.jqueryUI = RDR_offline ?
//     RDR_staticUrl+"global/js/jquery-ui-1.8.17.min.js" :
//     "http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.17/jquery-ui.min.js";

// RDR_scriptPaths.jqueryWithJqueryUI = RDR_offline ? 
//     RDR_staticUrl+"global/js/jquery-1.7.1-with-ui-1.8.17.js" :
//     RDR_staticUrl+"global/js/jquery-1.7.1.min-with-ui-1.8.17.min.js";

// RDR_scriptPaths.jqueryUI_CSS = RDR_offline ?
//     RDR_staticUrl+"global/css/jquery-ui-1.8.17.base.css" :
//     "http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.17/themes/base/jquery-ui.css";

rdr_loadScript({src:RDR_scriptPaths.jquery}, function(){
    
    if(isTouchBrowser){
        load_mobileEvents(jQuery);
    }
    jquery_onload(jQuery);
});

function jquery_onload(jQuery){

    //Give back the $ and jQuery.
    $R = jQuery.noConflict(true);
    var $ = $R;

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
        $('body').addClass('rdr_ie');
    }
    
    //A function to load all plugins including those (most) that depend on jQuery.
    //The rest of our code is then set off with RDR.actions.init();
    $RFunctions($R);
}

function load_mobileEvents(jQuery){
    (function(e){function d(){var e=o();if(e!==u){u=e;i.trigger("orientationchange")}}function E(t,n,r,i){var s=r.type;r.type=n;e.event.dispatch.call(t,r,i);r.type=s}e.attrFn=e.attrFn||{};var t=navigator.userAgent.toLowerCase(),n=t.indexOf("chrome")>-1&&(t.indexOf("windows")>-1||t.indexOf("macintosh")>-1||t.indexOf("linux")>-1)&&t.indexOf("chrome")<0,r={swipe_h_threshold:50,swipe_v_threshold:50,taphold_threshold:750,doubletap_int:500,touch_capable:"ontouchstart"in document.documentElement&&!n,orientation_support:"orientation"in window&&"onorientationchange"in window,startevent:"ontouchstart"in document.documentElement&&!n?"touchstart":"mousedown",endevent:"ontouchstart"in document.documentElement&&!n?"touchend":"mouseup",moveevent:"ontouchstart"in document.documentElement&&!n?"touchmove":"mousemove",tapevent:"ontouchstart"in document.documentElement&&!n?"tap":"click",scrollevent:"ontouchstart"in document.documentElement&&!n?"touchmove":"scroll",hold_timer:null,tap_timer:null};e.isTouchCapable=function(){return r.touch_capable};e.getStartEvent=function(){return r.startevent};e.getEndEvent=function(){return r.endevent};e.getMoveEvent=function(){return r.moveevent};e.getTapEvent=function(){return r.tapevent};e.getScrollEvent=function(){return r.scrollevent};e.each(["tapstart","tapend","tap","singletap","doubletap","taphold","swipe","swipeup","swiperight","swipedown","swipeleft","swipeend","scrollstart","scrollend","orientationchange"],function(t,n){e.fn[n]=function(e){return e?this.bind(n,e):this.trigger(n)};e.attrFn[n]=true});e.event.special.tapstart={setup:function(){var t=this,n=e(t);n.bind(r.startevent,function(e){n.data("callee",arguments.callee);if(e.which&&e.which!==1){return false}var i=e.originalEvent,s={position:{x:r.touch_capable?i.touches[0].screenX:e.screenX,y:r.touch_capable?i.touches[0].screenY:e.screenY},offset:{x:r.touch_capable?i.touches[0].pageX-i.touches[0].target.offsetLeft:e.offsetX,y:r.touch_capable?i.touches[0].pageY-i.touches[0].target.offsetTop:e.offsetY},time:(new Date).getTime(),target:e.target};E(t,"tapstart",e,s);return true})},remove:function(){e(this).unbind(r.startevent,e(this).data.callee)}};e.event.special.tapend={setup:function(){var t=this,n=e(t);n.bind(r.endevent,function(e){n.data("callee",arguments.callee);var i=e.originalEvent;var s={position:{x:r.touch_capable?i.changedTouches[0].screenX:e.screenX,y:r.touch_capable?i.changedTouches[0].screenY:e.screenY},offset:{x:r.touch_capable?i.changedTouches[0].pageX-i.changedTouches[0].target.offsetLeft:e.offsetX,y:r.touch_capable?i.changedTouches[0].pageY-i.changedTouches[0].target.offsetTop:e.offsetY},time:(new Date).getTime(),target:e.target};E(t,"tapend",e,s);return true})},remove:function(){e(this).unbind(r.endevent,e(this).data.callee)}};e.event.special.taphold={setup:function(){var t=this,n=e(t),i,s,o={x:0,y:0};n.bind(r.startevent,function(e){if(e.which&&e.which!==1){return false}else{n.data("tapheld",false);i=e.target;var s=e.originalEvent;var u=(new Date).getTime(),a={x:r.touch_capable?s.touches[0].screenX:e.screenX,y:r.touch_capable?s.touches[0].screenY:e.screenY},f={x:r.touch_capable?s.touches[0].pageX-s.touches[0].target.offsetLeft:e.offsetX,y:r.touch_capable?s.touches[0].pageY-s.touches[0].target.offsetTop:e.offsetY};o.x=e.originalEvent.targetTouches?e.originalEvent.targetTouches[0].pageX:e.pageX;o.y=e.originalEvent.targetTouches?e.originalEvent.targetTouches[0].pageY:e.pageY;r.hold_timer=window.setTimeout(function(){var l=e.originalEvent.targetTouches?e.originalEvent.targetTouches[0].pageX:e.pageX,c=e.originalEvent.targetTouches?e.originalEvent.targetTouches[0].pageY:e.pageY;if(e.target==i&&o.x==l&&o.y==c){n.data("tapheld",true);var h=(new Date).getTime(),p={x:r.touch_capable?s.touches[0].screenX:e.screenX,y:r.touch_capable?s.touches[0].screenY:e.screenY},d={x:r.touch_capable?s.touches[0].pageX-s.touches[0].target.offsetLeft:e.offsetX,y:r.touch_capable?s.touches[0].pageY-s.touches[0].target.offsetTop:e.offsetY};duration=h-u;var v={startTime:u,endTime:h,startPosition:a,startOffset:f,endPosition:p,endOffset:d,duration:duration,target:e.target};n.data("callee1",arguments.callee);E(t,"taphold",e,v)}},r.taphold_threshold);return true}}).bind(r.endevent,function(){n.data("callee2",arguments.callee);n.data("tapheld",false);window.clearTimeout(r.hold_timer)})},remove:function(){e(this).unbind(r.startevent,e(this).data.callee1).unbind(r.endevent,e(this).data.callee2)}};e.event.special.doubletap={setup:function(){var t=this,n=e(t),i,s,o,u;n.bind(r.startevent,function(e){if(e.which&&e.which!==1){return false}else{n.data("doubletapped",false);i=e.target;n.data("callee1",arguments.callee);u=e.originalEvent;o={position:{x:r.touch_capable?u.touches[0].screenX:e.screenX,y:r.touch_capable?u.touches[0].screenY:e.screenY},offset:{x:r.touch_capable?u.touches[0].pageX-u.touches[0].target.offsetLeft:e.offsetX,y:r.touch_capable?u.touches[0].pageY-u.touches[0].target.offsetTop:e.offsetY},time:(new Date).getTime(),target:e.target};return true}}).bind(r.endevent,function(e){var a=(new Date).getTime();var f=n.data("lastTouch")||a+1;var l=a-f;window.clearTimeout(s);n.data("callee2",arguments.callee);if(l<r.doubletap_int&&l>0&&e.target==i&&l>100){n.data("doubletapped",true);window.clearTimeout(r.tap_timer);var c={position:{x:r.touch_capable?u.touches[0].screenX:e.screenX,y:r.touch_capable?u.touches[0].screenY:e.screenY},offset:{x:r.touch_capable?u.touches[0].pageX-u.touches[0].target.offsetLeft:e.offsetX,y:r.touch_capable?u.touches[0].pageY-u.touches[0].target.offsetTop:e.offsetY},time:(new Date).getTime(),target:e.target};var h={firstTap:o,secondTap:c,interval:c.time-o.time};E(t,"doubletap",e,h)}else{n.data("lastTouch",a);s=window.setTimeout(function(e){window.clearTimeout(s)},r.doubletap_int,[e])}n.data("lastTouch",a)})},remove:function(){e(this).unbind(r.startevent,e(this).data.callee1).unbind(r.endevent,e(this).data.callee2)}};e.event.special.singletap={setup:function(){var t=this,n=e(t),i=null,s=null,o={x:0,y:0};n.bind(r.startevent,function(e){if(e.which&&e.which!==1){return false}else{s=(new Date).getTime();i=e.target;n.data("callee1",arguments.callee);o.x=e.originalEvent.targetTouches?e.originalEvent.targetTouches[0].pageX:e.pageX;o.y=e.originalEvent.targetTouches?e.originalEvent.targetTouches[0].pageY:e.pageY;return true}}).bind(r.endevent,function(e){n.data("callee2",arguments.callee);if(e.target==i){end_pos_x=e.originalEvent.changedTouches?e.originalEvent.changedTouches[0].pageX:e.pageX;end_pos_y=e.originalEvent.changedTouches?e.originalEvent.changedTouches[0].pageY:e.pageY;r.tap_timer=window.setTimeout(function(){if(!n.data("doubletapped")&&!n.data("tapheld")&&o.x==end_pos_x&&o.y==end_pos_y){var i=e.originalEvent;var u={position:{x:r.touch_capable?i.changedTouches[0].screenX:e.screenX,y:r.touch_capable?i.changedTouches[0].screenY:e.screenY},offset:{x:r.touch_capable?i.changedTouches[0].pageX-i.changedTouches[0].target.offsetLeft:e.offsetX,y:r.touch_capable?i.changedTouches[0].pageY-i.changedTouches[0].target.offsetTop:e.offsetY},time:(new Date).getTime(),target:e.target};if(u.time-s<r.taphold_threshold){E(t,"singletap",e,u)}}},r.doubletap_int)}})},remove:function(){e(this).unbind(r.startevent,e(this).data.callee1).unbind(r.endevent,e(this).data.callee2)}};e.event.special.tap={setup:function(){var t=this,n=e(t),i=false,s=null,o,u={x:0,y:0};n.bind(r.startevent,function(e){n.data("callee1",arguments.callee);if(e.which&&e.which!==1){return false}else{i=true;u.x=e.originalEvent.targetTouches?e.originalEvent.targetTouches[0].pageX:e.pageX;u.y=e.originalEvent.targetTouches?e.originalEvent.targetTouches[0].pageY:e.pageY;o=(new Date).getTime();s=e.target;return true}}).bind(r.endevent,function(e){n.data("callee2",arguments.callee);var a=e.originalEvent.targetTouches?e.originalEvent.changedTouches[0].pageX:e.pageX,f=e.originalEvent.targetTouches?e.originalEvent.changedTouches[0].pageY:e.pageY;if(s==e.target&&i&&(new Date).getTime()-o<r.taphold_threshold&&u.x==a&&u.y==f){var l=e.originalEvent;var c={position:{x:r.touch_capable?l.changedTouches[0].screenX:e.screenX,y:r.touch_capable?l.changedTouches[0].screenY:e.screenY},offset:{x:r.touch_capable?l.changedTouches[0].pageX-l.changedTouches[0].target.offsetLeft:e.offsetX,y:r.touch_capable?l.changedTouches[0].pageY-l.changedTouches[0].target.offsetTop:e.offsetY},time:(new Date).getTime(),target:e.target};E(t,"tap",e,c)}})},remove:function(){e(this).unbind(r.startevent,e(this).data.callee1).unbind(r.endevent,e(this).data.callee2)}};e.event.special.swipe={setup:function(){function f(t){n=e(t.target);n.data("callee1",arguments.callee);o.x=t.originalEvent.targetTouches?t.originalEvent.targetTouches[0].pageX:t.pageX;o.y=t.originalEvent.targetTouches?t.originalEvent.targetTouches[0].pageY:t.pageY;u.x=o.x;u.y=o.y;i=true;var s=t.originalEvent;a={position:{x:r.touch_capable?s.touches[0].screenX:t.screenX,y:r.touch_capable?s.touches[0].screenY:t.screenY},offset:{x:r.touch_capable?s.touches[0].pageX-s.touches[0].target.offsetLeft:t.offsetX,y:r.touch_capable?s.touches[0].pageY-s.touches[0].target.offsetTop:t.offsetY},time:(new Date).getTime(),target:t.target};var f=new Date;while(new Date-f<100){}}function l(t){n=e(t.target);n.data("callee2",arguments.callee);u.x=t.originalEvent.targetTouches?t.originalEvent.targetTouches[0].pageX:t.pageX;u.y=t.originalEvent.targetTouches?t.originalEvent.targetTouches[0].pageY:t.pageY;window.clearTimeout(r.hold_timer);var f;var l=n.data("xthreshold"),c=n.data("ythreshold"),h=typeof l!=="undefined"&&l!==false&&parseInt(l)?parseInt(l):r.swipe_h_threshold,p=typeof c!=="undefined"&&c!==false&&parseInt(c)?parseInt(c):r.swipe_v_threshold;if(o.y>u.y&&o.y-u.y>p){f="swipeup"}if(o.x<u.x&&u.x-o.x>h){f="swiperight"}if(o.y<u.y&&u.y-o.y>p){f="swipedown"}if(o.x>u.x&&o.x-u.x>h){f="swipeleft"}if(f!=undefined&&i){o.x=0;o.y=0;u.x=0;u.y=0;i=false;var d=t.originalEvent;endEvnt={position:{x:r.touch_capable?d.touches[0].screenX:t.screenX,y:r.touch_capable?d.touches[0].screenY:t.screenY},offset:{x:r.touch_capable?d.touches[0].pageX-d.touches[0].target.offsetLeft:t.offsetX,y:r.touch_capable?d.touches[0].pageY-d.touches[0].target.offsetTop:t.offsetY},time:(new Date).getTime(),target:t.target};var v=Math.abs(a.position.x-endEvnt.position.x),m=Math.abs(a.position.y-endEvnt.position.y);var g={startEvnt:a,endEvnt:endEvnt,direction:f.replace("swipe",""),xAmount:v,yAmount:m,duration:endEvnt.time-a.time};s=true;n.trigger("swipe",g).trigger(f,g)}}function c(t){n=e(t.target);var o="";n.data("callee3",arguments.callee);if(s){var u=n.data("xthreshold"),f=n.data("ythreshold"),l=typeof u!=="undefined"&&u!==false&&parseInt(u)?parseInt(u):r.swipe_h_threshold,c=typeof f!=="undefined"&&f!==false&&parseInt(f)?parseInt(f):r.swipe_v_threshold;var h=t.originalEvent;endEvnt={position:{x:r.touch_capable?h.changedTouches[0].screenX:t.screenX,y:r.touch_capable?h.changedTouches[0].screenY:t.screenY},offset:{x:r.touch_capable?h.changedTouches[0].pageX-h.changedTouches[0].target.offsetLeft:t.offsetX,y:r.touch_capable?h.changedTouches[0].pageY-h.changedTouches[0].target.offsetTop:t.offsetY},time:(new Date).getTime(),target:t.target};if(a.position.y>endEvnt.position.y&&a.position.y-endEvnt.position.y>c){o="swipeup"}if(a.position.x<endEvnt.position.x&&endEvnt.position.x-a.position.x>l){o="swiperight"}if(a.position.y<endEvnt.position.y&&endEvnt.position.y-a.position.y>c){o="swipedown"}if(a.position.x>endEvnt.position.x&&a.position.x-endEvnt.position.x>l){o="swipeleft"}var p=Math.abs(a.position.x-endEvnt.position.x),d=Math.abs(a.position.y-endEvnt.position.y);var v={startEvnt:a,endEvnt:endEvnt,direction:o.replace("swipe",""),xAmount:p,yAmount:d,duration:endEvnt.time-a.time};n.trigger("swipeend",v)}i=false;s=false}var t=this,n=e(t),i=false,s=false,o={x:0,y:0},u={x:0,y:0},a;n.bind(r.startevent,f);n.bind(r.moveevent,l);n.bind(r.endevent,c)},remove:function(){e(this).unbind(r.startevent,e(this).data.callee1).unbind(r.moveevent,e(this).data.callee2).unbind(r.endevent,e(this).data.callee3)}};e.event.special.scrollstart={setup:function(){function o(e,n){i=n;E(t,i?"scrollstart":"scrollend",e)}var t=this,n=e(t),i,s;n.bind(r.scrollevent,function(e){n.data("callee",arguments.callee);if(!i){o(e,true)}clearTimeout(s);s=setTimeout(function(){o(e,false)},50)})},remove:function(){e(this).unbind(r.scrollevent,e(this).data.callee)}};var i=e(window),s,o,u,a,f,l={0:true,180:true};if(r.orientation_support){var c=window.innerWidth||e(window).width(),h=window.innerHeight||e(window).height(),p=50;a=c>h&&c-h>p;f=l[window.orientation];if(a&&f||!a&&!f){l={"-90":true,90:true}}}e.event.special.orientationchange=s={setup:function(){if(r.orientation_support){return false}u=o();i.bind("throttledresize",d);return true},teardown:function(){if(r.orientation_support){return false}i.unbind("throttledresize",d);return true},add:function(e){var t=e.handler;e.handler=function(e){e.orientation=o();return t.apply(this,arguments)}}};e.event.special.orientationchange.orientation=o=function(){var e=true,t=document.documentElement;if(r.orientation_support){e=l[window.orientation]}else{e=t&&t.clientWidth/t.clientHeight<1.1}return e?"portrait":"landscape"};e.event.special.throttledresize={setup:function(){e(this).bind("resize",m)},teardown:function(){e(this).unbind("resize",m)}};var v=250,m=function(){b=(new Date).getTime();w=b-g;if(w>=v){g=b;e(this).trigger("throttledresize")}else{if(y){window.clearTimeout(y)}y=window.setTimeout(d,v-w)}},g=0,y,b,w;e.each({scrollend:"scrollstart",swipeup:"swipe",swiperight:"swipe",swipedown:"swipe",swipeleft:"swipe",swipeend:"swipe"},function(t,n,r){e.event.special[t]={setup:function(){e(this).bind(n,e.noop)}}})})(jQuery);
}

function $RFunctions($R){
    //called after our version of jQuery ($R) is loaded
    
    //alias $ here as well to be the same as our $R version of jQuery;
    var $ = $R;
    
    //load CSS
    var css = [];

    if ( !$R.browser.msie || ( $R.browser.msie && parseInt( $R.browser.version, 10 ) > 8 ) ) {
        css.push( RDR_staticUrl+"css/fonts/fontawesome.css" );
    }
    if ( $R.browser.msie ) {
        css.push( RDR_staticUrl+"widget/css/ie.css" );
        //todo: make sure that if this css file doens't exist, it won't bork.  Otherwise as soon as IE10 comes out, this will kill it.
        css.push( RDR_staticUrl+"widget/css/ie"+parseInt( $R.browser.version, 10) +".css" );
    }

    var widgetCSS = ( RDR_offline ) ? RDR_widgetCssStaticUrl+"widget/css/widget.css" : RDR_widgetCssStaticUrl+"widget/css/widget.min.css?rv26"
    css.push( widgetCSS );
    // css.push( RDR_scriptPaths.jqueryUI_CSS );
    css.push( RDR_staticUrl+"widget/css/jquery.jscrollpane.css" );

    loadCSS(css);

    function loadCSS(cssFileList){

        $R.each(cssFileList, function(i, val){
            $R('<link>').attr({
                href: val,
                rel: 'stylesheet'
            }).appendTo('body');
        });
    }

    //these are basic utils that can be used both in the plugins and main scripts.  Added to RDR.commonUtil;
    initCommonUtils($R);
        
    //init our plugins (includes rangy, but otherwise, mostly jquery plugins. The $R passed is our jQuery alias)
    initPlugins($R);

    //load our main scripts
    readrBoard($R);

    //run init functions
    RDR.actions.init();

    function initCommonUtils($){
        $.extend(RDR, {
            commonUtil: {
                prettyNumber: function(anInt){
                    // RDR.commonUtil.prettyNumber:
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

    function initPlugins($R){
        //All jquery plugins to be loaded using our $R version of jquery and before our widget code;

        //Rangy - init before our jquery
        var rangy = plugin_rangy();
        window.rangy = rangy;
        rangy.init();

        //jQuery Plugins
        plugin_jquery_log($R);
        plugin_jquery_hasAttr($R);
        plugin_jquery_json($R);
        plugin_jquery_postMessage($R);
        plugin_jquery_mustache($R);
        plugin_jquery_enhancedOffset($R);
        plugin_jquery_drags($R);
        plugin_jquery_mousewheel($R);
        plugin_jquery_isotope($R);
        plugin_jquery_jScrollPane($R);
        plugin_jquery_twitterTip($R);
        plugin_jquery_rdrWidgetSummary($R);
        plugin_jquery_selectionographer($R, rangy);

        /* are we using this */
        //todo: maybe need to fix this...
        // parents filter:  http://stackoverflow.com/questions/965816/what-jquery-selector-excludes-items-with-a-parent-that-matches-a-given-selector
        // doesn't seem to be working tho.
        $R.expr[':'].parents = function(a,i,m){
            return $R(a).parents(m[3]).length < 1;
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

            //add in alias temporaily to client $ so we can use regular $ instead of $R if we want
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
            var g,d,j=1,a,b=this,f=!1,h="postMessage",e="addEventListener",c,i=b[h]&&!$.browser.opera;$[h]=function(k,l,m){if(!l){return}k=typeof k==="string"?k:$.param(k);m=m||parent;if(i){m[h](k,l.replace(/([^:]+:\/\/[^\/]+).*/,"$1"))}else{if(l){m.location=l.replace(/#.*$/,"")+"#"+(+new Date)+(j++)+"&"+k}}};$.receiveMessage=c=function(l,m,k){if(i){if(l){a&&c();a=function(n){if((typeof m==="string"&&n.origin!==m)||($.isFunction(m)&&m(n.origin)===f)){return f}l(n)}}if(b[e]){b[l?e:"removeEventListener"]("message",a,f)}else{b[l?"attachEvent":"detachEvent"]("onmessage",a)}}else{g&&clearInterval(g);g=null;if(l){k=typeof m==="number"?m:typeof k==="number"?k:100;g=setInterval(function(){var o=document.location.hash,n=/^#?\d+&/;if(o!==d&&n.test(o)){d=o;l({data:o.replace(n,"")})}},k)}}}
        }
        //end function plugin_jquery_postMessage

        function plugin_jquery_drags(a){
            // replace jquery UI draggable
            // Simple JQuery Draggable Plugin
            // https://plus.google.com/108949996304093815163/about
            // Usage: $(selector).drags();
            // THIS HAS BEEN CUSTOMIZED FOR READRBOARD
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


                $elements.on('mousedown', function(e) {

                    if ( (opt.handle !== "" ) && !$(e.target).closest('.rdr_header').length ) {
                        // has a handle, but the handle is not clicked
                        return;
                    }

                    $selected.removeClass("rdr_rewritable");

                    var drg_h = $selected.outerHeight(),
                        drg_w = $selected.outerWidth(),
                        offsets = $selected.offset(), // cache
                        pos_y = offsets.top + drg_h - e.pageY,
                        pos_x = offsets.left + drg_w - e.pageX;

                    $(document).on("mousemove.rdr_drag", function(e) {
                        $selected.offset({
                            top: e.pageY + pos_y - drg_h,
                            left: e.pageX + pos_x - drg_w
                        });
                    }).on("mouseup", function() {
                        $(this).off("mousemove.rdr_drag"); // Unbind events from document
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

        function plugin_jquery_rdrWidgetSummary($){
            /*
             * jQuery Plugin by readrboard.com
             * builds the readrboard widget's summary widget.
             * accepts settings to customize the format
             */

            $.fn.rdrWidgetSummary = function( params ) {
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
                    var $this = ( this[0] === document ) ? $('.rdr-summary') : this,
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
                    var $this = ( this[0] === document ) ? $('.rdr-summary') : this;
                    return $this.each(function(index){
                        
                        //grab the basic setting just from the data 
                        var settings = $(this).data('settings');

                        //get the latest page data
                        settings.summary = RDR.pages[settings.id].summary;
                        _makeSummaryWidget(settings);
                    });
                }


            };
            //end methods

            //helper function for ajax above
            function _makeSummaryWidget(settings){
                
                var page = settings;
                
                var widgetClass = 'rdr-summary-key-'+page.key;

                //first kill any existing instances; we're going to recreate them.
                $('.'+widgetClass).remove();

                var $summary_widget_parent = $(page.parentContainer),
                    $summary_widget = $('<div class="rdr rdr-summary rdr-summary-'+page.id+' rdr-border-box" rdr-page-id="'+page.id+'"></div>').addClass(widgetClass);

                if ( RDR.engageScriptParams.bookmarklet == "true" ) {
                    $summary_widget.addClass('rdr_bookmarklet');
                }
                $summary_widget.data({
                    page_id:page.id,
                    page_key:page.key
                });

                var summaryWidgetInsertionMethod = ( RDR.group.summary_widget_method != "" ) ? RDR.group.summary_widget_method : "after";

                //page.jqFunc would be something like 'append' or 'after',
                //so this would read $summary_widget_parent.append($summary_widget);
                $summary_widget_parent[ summaryWidgetInsertionMethod ]($summary_widget);

                var placement = ($summary_widget_parent.hasClass('defaultSummaryBar')) ? "top":"top";
                $summary_widget.find('img.rdr_tooltip_this').tooltip({placement:placement});

                $summary_widget.append(
                    '<div class="rdr_chevron_cta"><i class="rdr_icon-chevron-down"></i></div>' +
                    '<a href="'+RDR_baseUrl+'" target="_blank" class="rdr_logo">'+
                        '<span class="no-rdr rdr-logo" title="This is <strong style=\'color:#4d92da;\'>ReadrBoard</strong>. Click to visit our site and learn more!" src="'+RDR_staticUrl+'widget/images/blank.png" ></span>'+
                    '</a>'
                );

                $summary_widget.find('.rdr-logo').click( function() {
                    // RDR.events.track('click_rb_icon_summ');
                });

                $summary_widget.find('.rdr-logo').tooltip({});

                var onActiveEvent = function(){
                    // let's get the reaction summaries for the page here.
                    getReactedContent();
                    var page_id = $(this).data('page_id');

                    var $rindow = RDR.rindow.make( "readMode", {is_page:true, page:page, tags:page.toptags} );

                    RDR.events.trackEventToCloud({
                        event_type: 'sb',
                        event_value: (page.toptags.length>0) ? 'vw':'ad',  // view or react
                        page_id: page_id
                    });
                };

                if(isTouchBrowser){
                    $summary_widget.bind('tap', function(){
                        onActiveEvent.call(this);
                        $(this).toggleClass('rdr_hover');
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
                    total_reactions+" Reactions" :
                        ( total_reactions > 0 ) ? 
                            total_reactions+" Reaction" :
                            "Reactions";
                $summary_widget.append(
                    '<a class="rdr_reactions_label">'+total_reactions_label+'</a>'
                );
                
            }

            function getReactedContent( counts ) {            
                // get all of the content_nodes for this page
                // may want to limit this on back-end by a date range
                if ( typeof RDR.interaction_data == "undefined" ) {
                    RDR.interaction_data = {};
                }
                
                $.each( RDR.summaries, function(hash, summary) {
                    $.each( summary.top_interactions.tags, function(tag_id,interaction) {
                        if (typeof interaction != "undefined" ) {
                            if ( typeof RDR.summaries[ hash ].content_nodes != "undefined") {
                                RDR.util.buildInteractionData();
                            } else {
                                RDR.actions.content_nodes.init( hash, function() {
                                    RDR.util.buildInteractionData();
                                });
                            }
                        }
                    });
                });
            } // getReactedContent


        }
        //end function plugin_jquery_rdrWidgetSummary

        function plugin_jquery_selectionographer($, rangy){
            /*
             * jquery.selectionographer.js
             * $.fn.selog aliases to $.fn.selectionographer
             * author: eric@readrboard.com
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
             * //temp readr note: to test in the live page, don't forget to use $R(), not $().
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
                filterOutRDRIndicator: function(range, params){
                    //check if $indicator is contained in the range, and if so, move the range's end to just before it.

                    var commonAncestorContainer = range.commonAncestorContainer;
                    var $indicator = $(commonAncestorContainer).find('.rdr_indicator');
                    if($indicator.length){
                        var inTheRange = range.containsNode($indicator[0], true); //2nd param is 'partial': (rangy docs for containsNode)
                        if(inTheRange){
                            range.setEndBefore( $indicator[0] );
                        }
                    }
                    return range;
                },
                stripWhiteSpace: function(range){
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
                    styleName: 'rdr_hilite',
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
                    $('.'+hiliter['class']).addClass(styleClass);
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

        function plugin_jquery_isotope($){
            /**
             * Isotope v1.5.26
             * An exquisite jQuery plugin for magical layouts
             * http://isotope.metafizzy.co
             *
             * Commercial use requires one-time purchase of a commercial license
             * http://isotope.metafizzy.co/docs/license.html
             *
             * Non-commercial use is licensed under the MIT License
             *
             * Copyright 2014 Metafizzy
             */

             /* PB: added a check for o.addTest since it's undefined when an older version of Modernizr is already on the page.  grumble. */
            !function(t,i){"use strict";var s,e=t.document,n=e.documentElement,o=t.Modernizr,r=function(t){return t.charAt(0).toUpperCase()+t.slice(1)},a="Moz Webkit O Ms".split(" "),h=function(t){var i,s=n.style;if("string"==typeof s[t])return t;t=r(t);for(var e=0,o=a.length;o>e;e++)if(i=a[e]+t,"string"==typeof s[i])return i},l=h("transform"),u=h("transitionProperty"),c={csstransforms:function(){return!!l},csstransforms3d:function(){var t=!!h("perspective");if(t&&"webkitPerspective"in n.style){var s=i("<style>@media (transform-3d),(-webkit-transform-3d){#modernizr{height:3px}}</style>").appendTo("head"),e=i('<div id="modernizr" />').appendTo("html");t=3===e.height(),e.remove(),s.remove()}return t},csstransitions:function(){return!!u}};if(o)for(s in c)o.hasOwnProperty(s)||(o.addTest && o.addTest(s,c[s]));else{o=t.Modernizr={_version:"1.6ish: miniModernizr for Isotope"};var d,f=" ";for(s in c)d=c[s](),o[s]=d,f+=" "+(d?"":"no-")+s;i("html").addClass(f)}if(o.csstransforms){var m=o.csstransforms3d?{translate:function(t){return"translate3d("+t[0]+"px, "+t[1]+"px, 0) "},scale:function(t){return"scale3d("+t+", "+t+", 1) "}}:{translate:function(t){return"translate("+t[0]+"px, "+t[1]+"px) "},scale:function(t){return"scale("+t+") "}},p=function(t,s,e){var n,o,r=i.data(t,"isoTransform")||{},a={},h={};a[s]=e,i.extend(r,a);for(n in r)o=r[n],h[n]=m[n](o);var u=h.translate||"",c=h.scale||"",d=u+c;i.data(t,"isoTransform",r),t.style[l]=d};i.cssNumber.scale=!0,i.cssHooks.scale={set:function(t,i){p(t,"scale",i)},get:function(t){var s=i.data(t,"isoTransform");return s&&s.scale?s.scale:1}},i.fx.step.scale=function(t){i.cssHooks.scale.set(t.elem,t.now+t.unit)},i.cssNumber.translate=!0,i.cssHooks.translate={set:function(t,i){p(t,"translate",i)},get:function(t){var s=i.data(t,"isoTransform");return s&&s.translate?s.translate:[0,0]}}}var y,g;o.csstransitions&&(y={WebkitTransitionProperty:"webkitTransitionEnd",MozTransitionProperty:"transitionend",OTransitionProperty:"oTransitionEnd otransitionend",transitionProperty:"transitionend"}[u],g=h("transitionDuration"));var v,_=i.event,A=i.event.handle?"handle":"dispatch";_.special.smartresize={setup:function(){i(this).bind("resize",_.special.smartresize.handler)},teardown:function(){i(this).unbind("resize",_.special.smartresize.handler)},handler:function(t,i){var s=this,e=arguments;t.type="smartresize",v&&clearTimeout(v),v=setTimeout(function(){_[A].apply(s,e)},"execAsap"===i?0:100)}},i.fn.smartresize=function(t){return t?this.bind("smartresize",t):this.trigger("smartresize",["execAsap"])},i.Isotope=function(t,s,e){this.element=i(s),this._create(t),this._init(e)};var w=["width","height"],C=i(t);i.Isotope.settings={resizable:!0,layoutMode:"masonry",containerClass:"isotope",itemClass:"isotope-item",hiddenClass:"isotope-hidden",hiddenStyle:{opacity:0,scale:.001},visibleStyle:{opacity:1,scale:1},containerStyle:{position:"relative",overflow:"hidden"},animationEngine:"best-available",animationOptions:{queue:!1,duration:800},sortBy:"original-order",sortAscending:!0,resizesContainer:!0,transformsEnabled:!0,itemPositionDataEnabled:!1},i.Isotope.prototype={_create:function(t){this.options=i.extend({},i.Isotope.settings,t),this.styleQueue=[],this.elemCount=0;var s=this.element[0].style;this.originalStyle={};var e=w.slice(0);for(var n in this.options.containerStyle)e.push(n);for(var o=0,r=e.length;r>o;o++)n=e[o],this.originalStyle[n]=s[n]||"";this.element.css(this.options.containerStyle),this._updateAnimationEngine(),this._updateUsingTransforms();var a={"original-order":function(t,i){return i.elemCount++,i.elemCount},random:function(){return Math.random()}};this.options.getSortData=i.extend(this.options.getSortData,a),this.reloadItems(),this.offset={left:parseInt(this.element.css("padding-left")||0,10),top:parseInt(this.element.css("padding-top")||0,10)};var h=this;setTimeout(function(){h.element.addClass(h.options.containerClass)},0),this.options.resizable&&C.bind("smartresize.isotope",function(){h.resize()}),this.element.delegate("."+this.options.hiddenClass,"click",function(){return!1})},_getAtoms:function(t){var i=this.options.itemSelector,s=i?t.filter(i).add(t.find(i)):t,e={position:"absolute"};return s=s.filter(function(t,i){return 1===i.nodeType}),this.usingTransforms&&(e.left=0,e.top=0),s.css(e).addClass(this.options.itemClass),this.updateSortData(s,!0),s},_init:function(t){this.$filteredAtoms=this._filter(this.$allAtoms),this._sort(),this.reLayout(t)},option:function(t){if(i.isPlainObject(t)){this.options=i.extend(!0,this.options,t);var s;for(var e in t)s="_update"+r(e),this[s]&&this[s]()}},_updateAnimationEngine:function(){var t,i=this.options.animationEngine.toLowerCase().replace(/[ _\-]/g,"");switch(i){case"css":case"none":t=!1;break;case"jquery":t=!0;break;default:t=!o.csstransitions}this.isUsingJQueryAnimation=t,this._updateUsingTransforms()},_updateTransformsEnabled:function(){this._updateUsingTransforms()},_updateUsingTransforms:function(){var t=this.usingTransforms=this.options.transformsEnabled&&o.csstransforms&&o.csstransitions&&!this.isUsingJQueryAnimation;t||(delete this.options.hiddenStyle.scale,delete this.options.visibleStyle.scale),this.getPositionStyles=t?this._translate:this._positionAbs},_filter:function(t){var i=""===this.options.filter?"*":this.options.filter;if(!i)return t;var s=this.options.hiddenClass,e="."+s,n=t.filter(e),o=n;if("*"!==i){o=n.filter(i);var r=t.not(e).not(i).addClass(s);this.styleQueue.push({$el:r,style:this.options.hiddenStyle})}return this.styleQueue.push({$el:o,style:this.options.visibleStyle}),o.removeClass(s),t.filter(i)},updateSortData:function(t,s){var e,n,o=this,r=this.options.getSortData;t.each(function(){e=i(this),n={};for(var t in r)n[t]=s||"original-order"!==t?r[t](e,o):i.data(this,"isotope-sort-data")[t];i.data(this,"isotope-sort-data",n)})},_sort:function(){var t=this.options.sortBy,i=this._getSorter,s=this.options.sortAscending?1:-1,e=function(e,n){var o=i(e,t),r=i(n,t);return o===r&&"original-order"!==t&&(o=i(e,"original-order"),r=i(n,"original-order")),(o>r?1:r>o?-1:0)*s};this.$filteredAtoms.sort(e)},_getSorter:function(t,s){return i.data(t,"isotope-sort-data")[s]},_translate:function(t,i){return{translate:[t,i]}},_positionAbs:function(t,i){return{left:t,top:i}},_pushPosition:function(t,i,s){i=Math.round(i+this.offset.left),s=Math.round(s+this.offset.top);var e=this.getPositionStyles(i,s);this.styleQueue.push({$el:t,style:e}),this.options.itemPositionDataEnabled&&t.data("isotope-item-position",{x:i,y:s})},layout:function(t,i){var s=this.options.layoutMode;if(this["_"+s+"Layout"](t),this.options.resizesContainer){var e=this["_"+s+"GetContainerSize"]();this.styleQueue.push({$el:this.element,style:e})}this._processStyleQueue(t,i),this.isLaidOut=!0},_processStyleQueue:function(t,s){var e,n,r,a,h=this.isLaidOut?this.isUsingJQueryAnimation?"animate":"css":"css",l=this.options.animationOptions,u=this.options.onLayout;if(n=function(t,i){i.$el[h](i.style,l)},this._isInserting&&this.isUsingJQueryAnimation)n=function(t,i){e=i.$el.hasClass("no-transition")?"css":h,i.$el[e](i.style,l)};else if(s||u||l.complete){var c=!1,d=[s,u,l.complete],f=this;if(r=!0,a=function(){if(!c){for(var i,s=0,e=d.length;e>s;s++)i=d[s],"function"==typeof i&&i.call(f.element,t,f);c=!0}},this.isUsingJQueryAnimation&&"animate"===h)l.complete=a,r=!1;else if(o.csstransitions){for(var m,p=0,v=this.styleQueue[0],_=v&&v.$el;!_||!_.length;){if(m=this.styleQueue[p++],!m)return;_=m.$el}var A=parseFloat(getComputedStyle(_[0])[g]);A>0&&(n=function(t,i){i.$el[h](i.style,l).one(y,a)},r=!1)}}i.each(this.styleQueue,n),r&&a(),this.styleQueue=[]},resize:function(){this["_"+this.options.layoutMode+"ResizeChanged"]()&&this.reLayout()},reLayout:function(t){this["_"+this.options.layoutMode+"Reset"](),this.layout(this.$filteredAtoms,t)},addItems:function(t,i){var s=this._getAtoms(t);this.$allAtoms=this.$allAtoms.add(s),i&&i(s)},insert:function(t,i){this.element.append(t);var s=this;this.addItems(t,function(t){var e=s._filter(t);s._addHideAppended(e),s._sort(),s.reLayout(),s._revealAppended(e,i)})},appended:function(t,i){var s=this;this.addItems(t,function(t){s._addHideAppended(t),s.layout(t),s._revealAppended(t,i)})},_addHideAppended:function(t){this.$filteredAtoms=this.$filteredAtoms.add(t),t.addClass("no-transition"),this._isInserting=!0,this.styleQueue.push({$el:t,style:this.options.hiddenStyle})},_revealAppended:function(t,i){var s=this;setTimeout(function(){t.removeClass("no-transition"),s.styleQueue.push({$el:t,style:s.options.visibleStyle}),s._isInserting=!1,s._processStyleQueue(t,i)},10)},reloadItems:function(){this.$allAtoms=this._getAtoms(this.element.children())},remove:function(t,i){this.$allAtoms=this.$allAtoms.not(t),this.$filteredAtoms=this.$filteredAtoms.not(t);var s=this,e=function(){t.remove(),i&&i.call(s.element)};t.filter(":not(."+this.options.hiddenClass+")").length?(this.styleQueue.push({$el:t,style:this.options.hiddenStyle}),this._sort(),this.reLayout(e)):e()},shuffle:function(t){this.updateSortData(this.$allAtoms),this.options.sortBy="random",this._sort(),this.reLayout(t)},destroy:function(){var t=this.usingTransforms,i=this.options;this.$allAtoms.removeClass(i.hiddenClass+" "+i.itemClass).each(function(){var i=this.style;i.position="",i.top="",i.left="",i.opacity="",t&&(i[l]="")});var s=this.element[0].style;for(var e in this.originalStyle)s[e]=this.originalStyle[e];this.element.unbind(".isotope").undelegate("."+i.hiddenClass,"click").removeClass(i.containerClass).removeData("isotope"),C.unbind(".isotope")},_getSegments:function(t){var i,s=this.options.layoutMode,e=t?"rowHeight":"columnWidth",n=t?"height":"width",o=t?"rows":"cols",a=this.element[n](),h=this.options[s]&&this.options[s][e]||this.$filteredAtoms["outer"+r(n)](!0)||a;i=Math.floor(a/h),i=Math.max(i,1),this[s][o]=i,this[s][e]=h},_checkIfSegmentsChanged:function(t){var i=this.options.layoutMode,s=t?"rows":"cols",e=this[i][s];return this._getSegments(t),this[i][s]!==e},_masonryReset:function(){this.masonry={},this._getSegments();var t=this.masonry.cols;for(this.masonry.colYs=[];t--;)this.masonry.colYs.push(0)},_masonryLayout:function(t){var s=this,e=s.masonry;t.each(function(){var t=i(this),n=Math.ceil(t.outerWidth(!0)/e.columnWidth);if(n=Math.min(n,e.cols),1===n)s._masonryPlaceBrick(t,e.colYs);else{var o,r,a=e.cols+1-n,h=[];for(r=0;a>r;r++)o=e.colYs.slice(r,r+n),h[r]=Math.max.apply(Math,o);s._masonryPlaceBrick(t,h)}})},_masonryPlaceBrick:function(t,i){for(var s=Math.min.apply(Math,i),e=0,n=0,o=i.length;o>n;n++)if(i[n]===s){e=n;break}var r=this.masonry.columnWidth*e,a=s;this._pushPosition(t,r,a);var h=s+t.outerHeight(!0),l=this.masonry.cols+1-o;for(n=0;l>n;n++)this.masonry.colYs[e+n]=h},_masonryGetContainerSize:function(){var t=Math.max.apply(Math,this.masonry.colYs);return{height:t}},_masonryResizeChanged:function(){return this._checkIfSegmentsChanged()},_fitRowsReset:function(){this.fitRows={x:0,y:0,height:0}},_fitRowsLayout:function(t){var s=this,e=this.element.width(),n=this.fitRows;t.each(function(){var t=i(this),o=t.outerWidth(!0),r=t.outerHeight(!0);0!==n.x&&o+n.x>e&&(n.x=0,n.y=n.height),s._pushPosition(t,n.x,n.y),n.height=Math.max(n.y+r,n.height),n.x+=o})},_fitRowsGetContainerSize:function(){return{height:this.fitRows.height}},_fitRowsResizeChanged:function(){return!0},_cellsByRowReset:function(){this.cellsByRow={index:0},this._getSegments(),this._getSegments(!0)},_cellsByRowLayout:function(t){var s=this,e=this.cellsByRow;t.each(function(){var t=i(this),n=e.index%e.cols,o=Math.floor(e.index/e.cols),r=(n+.5)*e.columnWidth-t.outerWidth(!0)/2,a=(o+.5)*e.rowHeight-t.outerHeight(!0)/2;s._pushPosition(t,r,a),e.index++})},_cellsByRowGetContainerSize:function(){return{height:Math.ceil(this.$filteredAtoms.length/this.cellsByRow.cols)*this.cellsByRow.rowHeight+this.offset.top}},_cellsByRowResizeChanged:function(){return this._checkIfSegmentsChanged()},_straightDownReset:function(){this.straightDown={y:0}},_straightDownLayout:function(t){var s=this;t.each(function(){var t=i(this);s._pushPosition(t,0,s.straightDown.y),s.straightDown.y+=t.outerHeight(!0)})},_straightDownGetContainerSize:function(){return{height:this.straightDown.y}},_straightDownResizeChanged:function(){return!0},_masonryHorizontalReset:function(){this.masonryHorizontal={},this._getSegments(!0);var t=this.masonryHorizontal.rows;for(this.masonryHorizontal.rowXs=[];t--;)this.masonryHorizontal.rowXs.push(0)},_masonryHorizontalLayout:function(t){var s=this,e=s.masonryHorizontal;t.each(function(){var t=i(this),n=Math.ceil(t.outerHeight(!0)/e.rowHeight);if(n=Math.min(n,e.rows),1===n)s._masonryHorizontalPlaceBrick(t,e.rowXs);else{var o,r,a=e.rows+1-n,h=[];for(r=0;a>r;r++)o=e.rowXs.slice(r,r+n),h[r]=Math.max.apply(Math,o);s._masonryHorizontalPlaceBrick(t,h)}})},_masonryHorizontalPlaceBrick:function(t,i){for(var s=Math.min.apply(Math,i),e=0,n=0,o=i.length;o>n;n++)if(i[n]===s){e=n;break}var r=s,a=this.masonryHorizontal.rowHeight*e;this._pushPosition(t,r,a);var h=s+t.outerWidth(!0),l=this.masonryHorizontal.rows+1-o;for(n=0;l>n;n++)this.masonryHorizontal.rowXs[e+n]=h},_masonryHorizontalGetContainerSize:function(){var t=Math.max.apply(Math,this.masonryHorizontal.rowXs);return{width:t}},_masonryHorizontalResizeChanged:function(){return this._checkIfSegmentsChanged(!0)},_fitColumnsReset:function(){this.fitColumns={x:0,y:0,width:0}},_fitColumnsLayout:function(t){var s=this,e=this.element.height(),n=this.fitColumns;t.each(function(){var t=i(this),o=t.outerWidth(!0),r=t.outerHeight(!0);0!==n.y&&r+n.y>e&&(n.x=n.width,n.y=0),s._pushPosition(t,n.x,n.y),n.width=Math.max(n.x+o,n.width),n.y+=r})},_fitColumnsGetContainerSize:function(){return{width:this.fitColumns.width}},_fitColumnsResizeChanged:function(){return!0},_cellsByColumnReset:function(){this.cellsByColumn={index:0},this._getSegments(),this._getSegments(!0)},_cellsByColumnLayout:function(t){var s=this,e=this.cellsByColumn;t.each(function(){var t=i(this),n=Math.floor(e.index/e.rows),o=e.index%e.rows,r=(n+.5)*e.columnWidth-t.outerWidth(!0)/2,a=(o+.5)*e.rowHeight-t.outerHeight(!0)/2;s._pushPosition(t,r,a),e.index++})},_cellsByColumnGetContainerSize:function(){return{width:Math.ceil(this.$filteredAtoms.length/this.cellsByColumn.rows)*this.cellsByColumn.columnWidth}},_cellsByColumnResizeChanged:function(){return this._checkIfSegmentsChanged(!0)},_straightAcrossReset:function(){this.straightAcross={x:0}},_straightAcrossLayout:function(t){var s=this;t.each(function(){var t=i(this);s._pushPosition(t,s.straightAcross.x,0),s.straightAcross.x+=t.outerWidth(!0)})},_straightAcrossGetContainerSize:function(){return{width:this.straightAcross.x}},_straightAcrossResizeChanged:function(){return!0}},i.fn.imagesLoaded=function(t){function s(){t.call(n,o)}function e(t){var n=t.target;n.src!==a&&-1===i.inArray(n,h)&&(h.push(n),--r<=0&&(setTimeout(s),o.unbind(".imagesLoaded",e)))}var n=this,o=n.find("img").add(n.filter("img")),r=o.length,a="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",h=[];return r||s(),o.bind("load.imagesLoaded error.imagesLoaded",e).each(function(){var t=this.src;this.src=a,this.src=t}),n};var z=function(i){t.console&&t.console.error(i)};i.fn.isotope=function(t,s){if("string"==typeof t){var e=Array.prototype.slice.call(arguments,1);this.each(function(){var s=i.data(this,"isotope");return s?i.isFunction(s[t])&&"_"!==t.charAt(0)?void s[t].apply(s,e):void z("no such method '"+t+"' for isotope instance"):void z("cannot call methods on isotope prior to initialization; attempted to call method '"+t+"'")})}else this.each(function(){var e=i.data(this,"isotope");e?(e.option(t),e._init(s)):i.data(this,"isotope",new i.Isotope(t,this,s))});return this}}(window,$);
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
                      $tip.addClass('rdr_tw_fade')
                    }

                    placement = typeof this.options.placement == 'function' ?
                      this.options.placement.call(this, $tip[0], this.$element[0]) :
                      this.options.placement

                    inside = /rdr_tw_in/.test(placement)

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
                      .addClass('rdr_tw_'+placement)
                      .addClass('rdr_tw_in')
                  }
                }

              , setContent: function () {
                  var $tip = this.tip()
                  $tip.find('.rdr_twtooltip-inner').html(this.getTitle())
                  $tip.removeClass('rdr_tw_fade rdr_tw_in rdr_tw_top rdr_tw_bottom rdr_tw_left rdr_tw_right')
                }

              , hide: function () {
                  var that = this
                    , $tip = this.tip()

                  $tip.removeClass('rdr_tw_in')

                  function removeWithAnimation() {
                    var timeout = setTimeout(function () {
                      $tip.off($.support.transition.end).remove();
                    }, 500)

                    $tip.one($.support.transition.end, function () {
                      clearTimeout(timeout)
                      $tip.remove()
                    })
                  }

                  $.support.transition && this.$tip.hasClass('rdr_tw_fade') ?
                    removeWithAnimation() :
                    $tip.remove();
                    if ( $.support.transition && this.$tip.hasClass('rdr_tw_fade') ) {
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
                  this[this.tip().hasClass('rdr_tw_in') ? 'hide' : 'show']()
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
              , template: '<div class="rdr rdr_twtooltip"><div class="rdr_twtooltip-arrow"></div><div class="rdr_twtooltip-inner"></div></div>'
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

            /*readrboard tweak to code:  replaced 4 instances of "span" with the var rdr_node */
            var rdr_node = "ins"; /*use the html node ins instead of span to avoid having the client's css affect our hilite wrapper*/

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
            a.startContainer.length:a.startContainer.childNodes.length))||!(a.endOffset<=(l.isCharacterDataNode(a.endContainer)?a.endContainer.length:a.endContainer.childNodes.length)))/*READRBOARD EDIT*//*throw Error*/RDR.actions.catchRangyErrors("Range error: Range is no longer valid after DOM mutation ("+a.inspect()+")");/*end READRBOARD EDIT*/}function W(){}function ea(a){a.START_TO_START=O;a.START_TO_END=Z;a.END_TO_END=ka;a.END_TO_START=la;a.NODE_BEFORE=ma;a.NODE_AFTER=na;a.NODE_BEFORE_AND_AFTER=oa;a.NODE_INSIDE=ja}function $(a){ea(a);ea(a.prototype)}function X(a,e){return function(){D(this);
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
            rangy.createModule("WrappedRange",function(k){function L(h,n,s,y){var A=h.duplicate();A.collapse(s);var p=A.parentElement();z.isAncestorOf(n,p,true)||(p=n);if(!p.canHaveHTML)return new C(p.parentNode,z.getNodeIndex(p));n=z.getDocument(p).createElement(rdr_node);var v,c=s?"StartToStart":"StartToEnd";do{p.insertBefore(n,n.previousSibling);A.moveToElementText(n)}while((v=A.compareEndPoints(c,h))>0&&n.previousSibling);c=n.nextSibling;if(v==-1&&c&&z.isCharacterDataNode(c)){A.setEndPoint(s?"EndToStart":"EndToEnd",
            h);if(/[\r\n]/.test(c.data)){p=A.duplicate();s=p.text.replace(/\r\n/g,"\r").length;for(s=p.moveStart("character",s);p.compareEndPoints("StartToEnd",p)==-1;){s++;p.moveStart("character",1)}}else s=A.text.length;p=new C(c,s)}else{c=(y||!s)&&n.previousSibling;p=(s=(y||s)&&n.nextSibling)&&z.isCharacterDataNode(s)?new C(s,0):c&&z.isCharacterDataNode(c)?new C(c,c.length):new C(p,z.getNodeIndex(n))}n.parentNode.removeChild(n);return p}function J(h,n){var s,y,A=h.offset,p=z.getDocument(h.node),v=p.body.createTextRange(),
            c=z.isCharacterDataNode(h.node);if(c){s=h.node;y=s.parentNode}else{s=h.node.childNodes;s=A<s.length?s[A]:null;y=h.node}p=p.createElement(rdr_node);p.innerHTML="&#feff;";s?y.insertBefore(p,s):y.appendChild(p);v.moveToElementText(p);v.collapse(!n);y.removeChild(p);if(c)v[n?"moveStart":"moveEnd"]("character",A);return v}k.requireModules(["DomUtil","DomRange"]);var K,z=k.dom,C=z.DomPosition,N=k.DomRange;if(k.features.implementsDomRange&&(!k.features.implementsTextRange||!k.config.preferTextRange)){(function(){function h(f){for(var j=
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
            a=typeof c;if(a=="string")if(c=="*")this.applyToAnytagBody=true;else this.tagNames=s(c.toLowerCase()).split(/\s*,\s*/);else if(a=="object"&&typeof c.length=="number"){this.tagNames=[];a=0;for(b=c.length;a<b;++a)if(c[a]=="*")this.applyToAnytagBody=true;else this.tagNames.push(c[a].toLowerCase())}else this.tagNames=[q]}h.requireModules(["WrappedSelection","WrappedRange"]);var g=h.dom,q=rdr_node,B=function(){function a(b,c,d){return c&&d?" ":""}return function(b,c){if(b.className)b.className=b.className.replace(RegExp("(?:^|\\s)"+
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
            rangy.createModule("SaveRestore",function(h,m){function n(a,g){var e="selectionBoundary_"+ +new Date+"_"+(""+Math.random()).slice(2),c,f=p.getDocument(a.startContainer),d=a.cloneRange();d.collapse(g);c=f.createElement(rdr_node);c.id=e;c.style.lineHeight="0";c.style.display="none";c.appendChild(f.createTextNode(q));d.insertNode(c);d.detach();return c}function o(a,g,e,c){if(a=(a||document).getElementById(e)){g[c?"setStartBefore":"setEndBefore"](a);a.parentNode.removeChild(a)}else m.warn("Marker element has been removed. Cannot restore selection.")}
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
    if(RDR_offline){
        RDR.debug();
    }
}
//end $RFunctions()

})();