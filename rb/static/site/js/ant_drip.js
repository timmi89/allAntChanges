;var ANTdrip = ANTdrip ? ANTdrip : {};

ANTdrip.init = function() {
    ANTdrip.initForms();
    ANTdrip.initCustomEventTracking();
};

ANTdrip.getOrCreateAnonymousEmail = function() {
    var urlParams = ANTdrip.getUrlParams();

    // do we already have a fake email address created?
    if ( !$.cookie('_ant_tp') ) {
        // nope, so make one.
        // if this person clicked a link in our outreach, specify the fake email
        if ( urlParams.ant_source == 'outreach' && urlParams.ant_value ) {
            var guid = 'outreach_id_' + urlParams.ant_value;
        } else {
            var guid = createGuid();
        }
        var _ant_tp = guid + '@antennaprospects.is';
        $.cookie('_ant_tp', _ant_tp, { expires: 180, path: '/' });
    } else {
        var _ant_tp = $.cookie('_ant_tp');
    }

    return _ant_tp;

    function createGuid()
    {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
};
ANTdrip.initCustomEventTracking = function() {
    var urlParams = ANTdrip.getUrlParams();

    // fire load event if they have a specified source
    if ( urlParams.ant_source && urlParams.ant_source == 'outreach' ) {
        // _dcq.push(["track", 'Visited Website', { 'ant_source': urlParams.ant_source, 'ant_value':urlParams.ant_value } ]);
        var userFields = {};

        userFields['ant_source'] = urlParams.ant_source;
        userFields['ant_source'] = urlParams.ant_source;
        userFields['email'] = ANTdrip.getOrCreateAnonymousEmail(); // create a unique, random email address, so we can identify anonymous prospects in Drip
        // userFields['new_email'] = 'randomperson2a@antenna.is'; // SOMETHING IF WE NEED TO ID ANONYMOUS USERS
        userFields[ urlParams.ant_source + '_id' ] = urlParams.ant_value;
        userFields['tags'] = [ urlParams.ant_source ];

        _dcq.push(["identify", userFields ]);
    }

    if ( urlParams.ant_source ) {
        if (urlParams.ant_value) {
            _dcq.push(["track", urlParams.ant_source, { 'event_value':urlParams.ant_value } ]);
        } else {
            _dcq.push(["track", urlParams.ant_source ]);
        }
    }

    // if someone clicks to chat with us on Tawk, log that in Drip
    $('#tawkchat-minified-iframe-element').ready(function(){
        // wait a moment then apply this event.  wasn't working without some sort of a pause.
        setTimeout( function() {
            $('#tawkchat-minified-iframe-element').contents().find('body').click(function(){
                _dcq.push(["track", 'Opened Tawk Chat' ]);
            });

        }, 750);
    });

    // if someone Reacts on the site, let's log that in Drip.
    document.addEventListener("antenna.reaction", function(){
      var lastEvent = antenna.getLastEvent();
      if (lastEvent.event == 'antenna.reaction') {
        _dcq.push(["track", 'Reacted', { 'page_title':document.title } ]);
      }
    },false);

    // if someone views reactions on the site, let's log that in Drip.
    document.addEventListener("antenna.reactionview", function(){
      var lastEvent = antenna.getLastEvent();
      if (lastEvent.event == 'antenna.reactionview') {
        _dcq.push(["track", 'Viewed Reactions', { 'page_title':document.title } ]);
      }
    },false);

};
ANTdrip.getUrlParams = function(optQueryString) {
    //thanks: http://stackoverflow.com/a/2880929/1289255
    //I haven't verfied that this is 100% perfect for every url case, but it's solid.
    
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
}
    
ANTdrip.initForms = function() {
    $('.drip-form').each(function() {
      $(this).submit(function () {
        var $form = $(this);

        // var drip_form_id = $form.find('[name="fields[drip_form_id]"]').val(),
        var valid = true,
            email = $form.find('[name="fields[email]"]').val(),
            website_url = $form.find('[name="fields[website_url]"]').val(),
            form_id = $form.find('[name="fields[form_id]"]').val(),
            goal_name = $form.find('[name="fields[goal_name]"]').val();
            // fields = {
            //     email: email,
            //     website_url: website_url,
            //     form_id: form_id
            // };

        // quick/dirty form "validation"
        $form.find('[data-required]').each(function() {
            if ( !$(this).val() ) {
                valid = false;
            }
        });

        // if form is valid, identify this user in our Drip acct for tracking prospects and their on-site behavior
        if (valid === true) {
            _dcq.push(["identify", {
              email: ANTdrip.getOrCreateAnonymousEmail(), // create a unique, random email address, so we can identify anonymous prospects in Drip
              new_email: email,
              prospect: true,
              website_url: website_url,
              form_id:form_id,
              success: function() {
                _dcq.push(["track", goal_name ]);
                $form.find('.success').removeClass('hide').siblings('.form-message').addClass('hide');
              },
              failure: function() {
                $form.find('.error').removeClass('hide').siblings('.form-message').addClass('hide');
              }
            }]);
        } else {
            $form.find('.not-valid').removeClass('hide').siblings('.form-message').addClass('hide');
        }


        return false;
      });
    });
};