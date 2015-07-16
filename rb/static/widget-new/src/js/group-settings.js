
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