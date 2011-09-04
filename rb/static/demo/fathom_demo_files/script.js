var FATHOM = (function(){

  function init(){

      /**
      * Cross browsers placeholders
      */
        $('[placeholder]').focus(function() {
          var input = $(this);
          if (input.val() == input.attr('placeholder')) {
            input.val('');
            input.removeClass('placeholder');
          }
        }).blur(function() {
          var input = $(this);
          if (input.val() == '' || input.val() == input.attr('placeholder')) {
            input.addClass('placeholder');
            input.val(input.attr('placeholder'));
          }
          }).blur();
          $('[placeholder]').parents('form').submit(function() {
            $(this).find('[placeholder]').each(function() {
            var input = $(this);
            if (input.val() == input.attr('placeholder')) {
              input.val('');
            }
          })
        });
  
    $(".oembed").oembed(null,{
        embedMethod: "append",
        maxWidth: 600,
        maxHeight: 768
     });
  }

  /**
  * Featured image rollover
  */
  function featuredImage(){
    $("span.feature").mouseenter(function() {
        $("span.teaser").stop().animate({ bottom: 0 },{ easing: "easeInOutQuint", duration: 200 });
    }).mouseleave(function(){
        $("span.teaser").stop().animate({ bottom: -78 }, { easing: "easeInOutQuint", duration: 200 });
    });
  }

  function homepageSlides() {
      if (typeof postcards != "undefined") {
          var buttons = [];
          var pager = $('.controls');

          var slides = $('.slide-items');
          slides.empty();

          var subtitle = "";

          for (var i = 0, jj = postcards.length; i < jj; i++) {
              subtitle = postcards[i].type;
              subtitle = postcards[i].subtitle;

              var target = "";
              if (typeof postcards[i].target != 'undefined') {
                  target = ' target="' + postcards[i].target + '"';
              }

              slides.append(
              "<div class='large'>"+
              "<div class='section " + postcards[i].section + "'><\/div>"+
                   "<a href='" + postcards[i].url + "' title='" + postcards[i].title + "'>"+
                      "<span class='feature'>"+
                          "<span class='teaser'>"+
                            "<span class='title'>" + postcards[i].title + "<\/span>"+
                            "<span class='snippet'>" + postcards[i].teaser + "<\/span>"+
                          "<\/span>"+
                          "<img src='" + postcards[i].img + "' alt='" + postcards[i].title + "' width='600' height='400' />"+
                      "<\/span>"+
                  "<\/a>"+
              "<\/div>");
          }

          $('.slide-items').cycle({
              fx:     'scrollHorz',
              timeout: 5000,
              speed:  1600,
              easing:  'easeInOutQuint',
              pager:  '.pager',
              activePagerClass: 'active',
              cleartype: !$.support.opacity
          });

      }
  }


  return {
    init: init,
    featuredImage: featuredImage,
    homepageSlides: homepageSlides
  }

}());

$(document).ready(function() {
    FATHOM.init();
});

jQuery.extend( jQuery.easing, {
    easeInOutQuint: function (x, t, b, c, d) {
        if ((t/=d/2) < 1) {return c/2*t*t*t*t*t + b;}
        return c/2*((t-=2)*t*t*t*t + 2) + b;
    }
});
