function open_popup(url) {
    my_window = window.open(url, "flowplayer", "status=yes,width=710,height=450,location=no,menubar=no,titlebar=no");
};

function checkFlash() {
    return swfobject.hasFlashPlayerVersion("10.1");
};

var hasFlash = false; //checkFlash();
var isAndroid = /Android/i.test(navigator.userAgent);
var isiPhone = /iPhone/i.test(navigator.userAgent);
var isiPad = /iPad/i.test(navigator.userAgent);
var isiPod = /iPod/i.test(navigator.userAgent);
var isiDevice = isiPhone || isiPad || isiPod;
var isMobile = isAndroid || isiPhone || isiPad || isiPod;
var isAndroidPhone = false;

if (isAndroid && /Mobile/i.test(navigator.userAgent)) {
    isAndroidPhone = true;
}
var isPhone = isiPhone | isiPod | isAndroidPhone;

var platform = 'desktop';

if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent))
    platform = 'mobile';

var device = 'desktop';
if (isAndroid)
    device = 'Android';
if (isiPhone)
    device = 'iPhone';
if (isiPad)
    device = 'iPad';
if (isiPod)
    device = 'iPod';

URL_DEVICE_PREFIX = 'nowthisnews';

function show_make_thumbnail_popup(image_id) {
    my_window = window.open('/entry/ajax/show_make_thumbnail_page/'+image_id+'/', "", "status=yes,width=700,height=600,location=no,menubar=no,titlebar=no");
}


function run_ios_app(data) {
    if (need_to_run()) {
        var original = document.location;
        document.location = make_ios_app_url(data);
        repeat_url(original);
    }
}

function need_to_run() {
    if (isiDevice && document.location.search.indexOf('repeat') == -1 ) {
        return true;
    }
    return false
}

function make_ios_app_url(data) {
    var url = URL_DEVICE_PREFIX+'://'+'www.nowthisnews.com/'+make_url_params(data);
    return url;
}

function make_url_params(data) {
    var param = '';
    for (var key in data) {
        if (!param) {
            param = '?';
        } else {
            param = param + '&';
        }
        param = param + key + '=' + encodeURIComponent(data[key]);
    }
    return param;
}

function repeat_url(original) {
    setTimeout( function() {
        document.location = make_repeat_url(original);
    }, 1000);
}

function make_repeat_url(original) {
    if (original.search) {
        return original + '&repeat=true';
    } else {
        return original + '?repeat=true';
    }
}

function facebook_share(url) {
    myWin=open("http://www.facebook.com/sharer.php?u="+url,"displayWindow","width=520,height=300,left=350,top=170,status=no,toolbar=no,menubar=no");
  };

function twitter_share(url, text) {
    myWin=open("https://twitter.com/share?url="+url+"&text="+text+" - on @NowThisNews", "displayWindow","width=520,height=300,left=350,top=170,status=no,toolbar=no,menubar=no");
}

function show_embed() {
    $('.fp-embed-code').toggle();
}

function show_splash_embed(button) {
    embed_code = $('.fp-splash-embed-code');
    embed_code.toggle();
}

function load_aol_subcategories(category_element) {
    var selected_category = $(category_element).find("option:selected").val();
    $.ajax({url: '/entry/ajax/get_aol_subcategories/',
                data: {'selected_aol_category': selected_category},
                success: update_aol_subcategories,
                error: function(data) {alert('Error to load data');console.log(data.responseText);},
                dataType: 'json',
               });
}

function update_aol_subcategories(data) {
    $('#id_aol_subcategory').empty();
    $.each(data, function(index, data) {
        $('#id_aol_subcategory').append($("<option></option>")
                                        .attr("value", data.id).text(data.name));
    })
}

$.urlParam = function(name){
    var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results==null){
       return null;
    }
    else{
       return results[1] || 0;
    }
}

$.cookies = function(name) {
    var matches = document.cookie.match(new RegExp(
    "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : undefined;
}
