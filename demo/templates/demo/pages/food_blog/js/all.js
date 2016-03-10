(function(cash) { "use strict";
                 
	///////////////////////////////center_image//////////////////////////////////////////////////////////
                 
	var obj;
	function center_image(){
		$('.center_img').each(function(){
			obj = $(this);
			var bg_ratio = obj.attr('data-width-img')/obj.attr('data-height-img');
			var wrapper_ratio = obj.parent().width()/obj.parent().height();
			if(bg_ratio<wrapper_ratio){
				var center = (obj.parent().width()/bg_ratio - obj.parent().height())*(-0.5);
				obj.css({'left':'0px', 'top':center, 'width':'100%', 'height':'auto'});
			}
			else{
				var center_hor = (bg_ratio*obj.parent().height() - obj.parent().width())*(-0.5);
				obj.css({'left':center_hor, 'top':'0px', 'height':'100%', 'width':'auto'});
			}
		});
	}
                 
 
	////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	/////////////////////////center_bg///////////////////////////////////////////////////////////////
                 
	function center_bg(){
		$('.center-image1').each(function(){
		  var bgSrc = $(this).attr('src');
		  $(this).parent().css({'background-image':'url('+bgSrc+')'});
		  $(this).remove();
		});
	}
	center_bg();
    
    $('.scrol').click(function(){
		var selected = $(this).attr('href');	
		$.scrollTo(selected, 500);		
		return false;
	});
    
    
      
                 
  ////////////////////NiceScroll////////////////////////////////////////////////////////////////////////////////////
	
    // var ScrollBarIn;             
    // $(function(){             
    //      ScrollBarIn = $('.scrollbar-inner').niceScroll({
    //          cursorwidth: "3px",
    //          cursorcolor: "#ccd6dd",
    //          background: "#f5f8fa",
    //          disableoutline: true,
    //          autohidemode: false,
    //          cursorborder: false,
    //          railoffset: { top: 20, right: 0, left: -10, bottom: 100 },
    //          railpadding: { top: -20, right: 1, left: 0, bottom: 60 },
    //          railalign: "right",
    //          zindex: 10
    //      });
    // });
    
        
     
    
  
  	////////////////////////////////////////SLIDERS/////////////////////////////////////////////////////
                
                 
     //===================tabs slider========================================================================//
                 
      var baner_tabs;         
		 $(function(){
			 baner_tabs = $('.tabs-baner').swiper({
				slidesPerView: 4,
                loop: true,
                grabCursor: true,
                calculateHeight: true
			});
      });
                 
    //===================big-block-slider========================================================================//
                 
     var big_block_container;         
		 $(function(){
			 big_block_container = $('.big-block-baner').swiper({
				slidesPerView: 1,
                loop: true,
                grabCursor: true,
                calculateHeight: true,
                useCSS3Transforms: false,
                onInit: function() {
					$('.preview-hover').eq(big_block_container.activeLoopIndex).addClass('color');
				}, 
                onSlideNext:function(){
                    $('.preview-hover').eq(big_block_container.activeLoopIndex).removeClass('color');
                },
                onSlideChangeStart: function() {
                    $('.preview-hover').removeClass('color');
                    $('.preview-hover').eq(big_block_container.activeLoopIndex).addClass('color');
                } 
			});
      });
                 
      $('.block-slider .slide-prev').click(function(){
		big_block_container.swipePrev();
		return false;
	  });
	
	  $('.block-slider .slide-next').click(function(){
		big_block_container.swipeNext();
		return false;
	  });             
                 
     $('.preview-hover').click(function(){
			var eqIndex = $('.preview-hover').index(this);
			$('.preview-hover').removeClass('color');
			$(this).addClass('color');
			big_block_container.swipeTo(eqIndex);
			big_block_container.stopAutoplay();
			return false;
		}); 
                 
    //===================news-slider========================================================================//  
                 
     var news_container;         
		 $(function(){
			 news_container = $('.news-baner').swiper({
				slidesPerView: 1,
                loop: true,
                grabCursor: true,
                calculateHeight: true
			});
      });
                 
      $('.news-slider .slide-prev').click(function(){
		news_container.swipePrev();
		return false;
	  });
	
	  $('.news-slider .slide-next').click(function(){
		news_container.swipeNext();
		return false;
	  });
    
     //===================news-slider-tags========================================================================//              
                 
      var news_container_tags;         
		 $(function(){
			 news_container_tags = $('.news-baner-tags').swiper({
				slidesPerView: 1,
                loop: true,
                grabCursor: true,
                calculateHeight: true
			});
      });
                 
      $('.news-slider-tags .slide-prev').click(function(){
		news_container_tags.swipePrev();
		return false;
	  });
	
	  $('.news-slider-tags .slide-next').click(function(){
		news_container_tags.swipeNext();
		return false;
	  }); 
                 
      //===================news-slider-recommended========================================================================//
                 
      var news_recomm;         
		 $(function(){
			 news_recomm = $('.recomm-baner').swiper({
				slidesPerView: 3,
                loop: true,
                grabCursor: true,
                calculateHeight: true,
                resizeReInit: true,
                onInit: function(swiper){
					  if($(window).width()<=530){
						news_recomm.params.slidesPerView = 1;
                      } else if($(window).width()<=1200){
						news_recomm.params.slidesPerView = 2;
					  } else {
						news_recomm.params.slidesPerView = 3;
					  }
				}
			});
      });
                 
      $('.recom-block .slide-prev').click(function(){
		news_recomm.swipePrev();
		return false;
	  });
	
	  $('.recom-block .slide-next').click(function(){
		news_recomm.swipeNext();
		return false;
	  });             
          
    //===================slider-trend========================================================================//
                 
     var baner_trand;         
		 $(function(){
			 baner_trand = $('.trend-baner').swiper({
				slidesPerView: 'auto',
                loop: false,
                grabCursor: true,
                calculateHeight: true
			});
      });
                 
      $('.slider-nav .slide-prev').click(function(){
		baner_trand.swipePrev();
		return false;
	  });
	
	  $('.slider-nav .slide-next').click(function(){
		baner_trand.swipeNext();
		return false;
	  });
                 
     //===================top-full-width-slider========================================================================// 
    
                 
        if ($('body').hasClass('owl-page'))  {        
      var OwlSlider;                 
        $(function(){             
             OwlSlider = $(".owl-carousel").owlCarousel({
                    center: true,
                    loop:true,
                    responsiveClass:true,
                    autoWidth: true,
                    responsive:{
                        0:{
                            items:1
                        },
                        600:{
                            items:2
                        },
                        1000:{
                            items:3
                        }
                    }
                
              });
        });
        }

        $('.next').click(function() {
                OwlSlider.trigger('next.owl.carousel');
            });

        $('.prev').click(function() {
                OwlSlider.trigger('prev.owl.carousel');
            });     
                 
                 
	///////////////////////ScrollBar/////////////////////////////////////////////////////////////////////////////////
                 
	// function rax(){
 //      var ScrollBarIn;             
 //        $(function(){             
 //             ScrollBarIn = $('.scrollbar-inner').niceScroll({
 //                 cursorwidth: "3px",
 //                 cursorcolor: "#ccd6dd",
 //                 background: "#f5f8fa",
 //                 disableoutline: true,
 //                 autohidemode: false,
 //                 cursorborder: false,
 //                 railoffset: { top: 20, right: 0, left: -10, bottom: 100 },
 //                 railpadding: { top: -20, right: 1, left: 0, bottom: 60 },
 //                 railalign: "right",
 //                 zindex: 10
 //             });
 //        });

 //       } 
    
 //    rax();            
                 
	////////////////////////WINDOW LOAD////////////////////////////////////////////////////////////////////////////////
  
   
     var index_mass = 0; 
     var index_mass_max = 0;
     var ajx_index_scrool = $('.ajax-wrapper').length;   
     var index_mass_max1 = 0;
     var str;
    
     $(window).load(function(){
         center_image();
         
         $('.arc-year:first').find('span').addClass('slide-mounth');
         $('.archive-baner-ajax').hide();
         
         var $container = document.querySelector('#item-cont');
         var msnry = new Masonry( $container, {
              itemSelector: '.item',
              columnwidth: '.item'  
            });
          
         index_mass_max = $('#item-cont').height(); 
         
         $('.ajax-wrapper').each(function(){
             var objj = $(this);
             str = objj.find('.item:last').css('top');
               index_mass = parseInt($('#item-cont').height() - str.substring(0, str.length - 2)); 
                  index_mass_max1 = parseInt(index_mass_max1 + index_mass);
         });
        $('#item-cont').height(index_mass_max - index_mass_max1);
         
         if($('#map-canvas-contact').length==1){
		 initialize('map-canvas-contact');}
         
         $('.load').hide();
     });           
    
    ///////////////////////WINDOW SCROLL///////////////////////////////////////////////////////////////////////////////// 
                 
                     
   var indxe_aj = 0; 
   var finish = 0;              
     $(window).scroll(function() {  
      
           if($('#item-cont').height() >= $(window).scrollTop()) {

            
            if(indxe_aj <= $('.ajax-wrapper').length - 1 ){
                    if (finish) return false;
				    finish = 1;
                        setTimeout (function() {
                        str = $('.ajax-wrapper').eq(indxe_aj).find('.item:last').css('top');
                        str.substring(0, str.length - 2);
                        if(indxe_aj == $('.ajax-wrapper').length-1 ){
                            str = $('.ajax-wrapper').eq(indxe_aj).find('.item:last').height()+parseInt(str)+50;
                            $('.itemLoad').fadeOut(500);
                        }
                        
                        $('#item-cont').animate({'height':str},1000, function(){

                                indxe_aj++;
                                 finish=0;

                        }); 
                    },2000); 
            }
           } 
    });
                 
    /////////////////////GOOGLE MAP///////////////////////////////////////////////////////////////             
    
     function initialize(obj) {
		var lat = $('#'+obj).attr("data-lat");
        var lng = $('#'+obj).attr("data-lng");
		var contentString = $('#'+obj).attr("data-string");
		var myLatlng = new google.maps.LatLng(lat,lng);
		var map, marker, infowindow;
		var image = 'img/marker.png';
		var zoomLevel = parseInt($('#'+obj).attr("data-zoom"), 10);

		var styles = []
		
		var styledMap = new google.maps.StyledMapType(styles,{name: "Styled Map"});
	
		var mapOptions = {
			zoom: zoomLevel,
			disableDefaultUI: true,
			center: myLatlng,
            scrollwheel: false,
			mapTypeControlOptions: {
            mapTypeIds: [google.maps.MapTypeId.ROADMAP, 'map_style']
			}
		}
		
		map = new google.maps.Map(document.getElementById(obj), mapOptions);
	
		map.mapTypes.set('map_style', styledMap);
		map.setMapTypeId('map_style');
	
		infowindow = new google.maps.InfoWindow({
			content: contentString
		});
      
	    
        marker = new google.maps.Marker({
			position: myLatlng,
			map: map,
			icon: image
		});
	
		google.maps.event.addListener(marker, 'click', function() {
			infowindow.open(map,marker);
		});
	
	}             

                            
	///////////////////////LOAD MORE CLICK/////////////////////////////////////////////////////////////////////////////////
                 
   var load_more_comment = $('.loaded-comment').html();
	$(document).on('click', '.load-more-comment', function(){
		$('.loaded-comment').append('<div class="ajax-slide" style="display: none;">'+load_more_comment+'</div>');
		$('.ajax-slide').fadeIn(800, function(){$(this).replaceWith($(this).html())});       
		return false;

	});
                             
	/////////////////////////WINDOW REZISE///////////////////////////////////////////////////////////////////////////////
                 
	$(window).resize(function(){
		$('body *').addClass('animation-stop');
		rax();
		center_image();
		$('body *').removeClass('animation-stop');
        
	}); 
    
    /////////////////////REMOVE HOVER///////////////////////////////////////////////////////////////
                 
	removeHoverCSSRule();
	function removeHoverCSSRule() {
	  if ('createTouch' in document) {
		try {
		  var ignore = /:hover/;
		  for (var i = 0; i < document.styleSheets.length; i++) {
			var sheet = document.styleSheets[i];
			if (!sheet.cssRules) {
			  continue;
			}
			for (var j = sheet.cssRules.length - 1; j >= 0; j--) {
			  var rule = sheet.cssRules[j];
			  if (rule.type === CSSRule.STYLE_RULE && ignore.test(rule.selectorText)) {
				sheet.deleteRule(j);
			  }
			}
		  }
		}
		catch(e) {
		}
	  }
	}
    
    
    $('#videopic').on( "click", function() {
			$('#video iframe').attr('src',$('#videopic').attr('href'));
              $('#video').show();
                $('#videopic').hide();
			return false;
	});
                 
    /////////////////////mobile icon///////////////////////////////////////////////////////////////             
                 
    $('.menu-mobile-icon, .close-menu').on( "click", function() {
             if($('.navigation nav').hasClass('active')){ 
                $('.menu-mobile-icon').show();
                $('.navigation nav').removeClass('active'); 
                $('body').removeClass('fix');
             }else{
                $('.menu-mobile-icon').hide();
                $('.navigation nav').addClass('active');
                $('body').addClass('fix');
             }
             return false;
    });
                 
   $('.drop-span').on( "click", function() {
       $('.drop-down').slideDown(500);
       if ($('.drop-down').hasClass('slide')) {
          $('.link').find('.drop-down').removeClass('slide').slideUp(500);
       }else{
           $('.link').find('.drop-down').addClass('slide').slideDown(500);
       }
       return false;
   }); 
                 
    $('.drop-left').on( "click", function() {
			if($('.drop-list').hasClass('act')){
				$('.drop-list').removeClass('act');
				$('.drop-left').find('span').slideUp(300);
			}else{
				$('.drop-list').addClass('act');
				$('.drop-left').find('span').slideDown(300);
			}
			return false;
		});
		
       $('.drop-left span a').on( "click", function() {
			$(this).parent().parent().find('.check').text($(this).text());
			$('.drop-left').find('span').slideUp(300);
		});
    
     
    
                 
    $('.drop-right').on( "click", function() {
			if($('.drop-list').hasClass('act')){
				$('.drop-list').removeClass('act');
				$('.drop-right').find('span').slideUp(300);
            
			}else{
				$('.drop-list').addClass('act');
				$('.drop-right').find('span').slideDown(300);
                
			}
			return false;
		});
    $('.drop-right span a').on( "click", function() {
			$(this).parent().parent().find('.check').text($(this).text());
			$('.drop-right').find('span').slideUp(300);
		});
		
    
    $('header').on( "click", function() {
        $('.drop-left').find('span').slideUp(300);
        $('.drop-right').find('span').slideUp(300);
       
    });
                  
      
    $('.button-totop').on( "click", function() {              
        $('body,html').animate({
             scrollTop: 0
         }, 400);
           return false;
    }); 
 
    
    /////////////////////header white///////////////////////////////////////////////////////////////
    
    if ($(window).width() > 990) {
    $('.fa-navicon').on( "click", function() {
        if ($('.header-white .top-setting').hasClass('slide')){
           $('.header-white .top-setting').removeClass('slide');
           $('.top-seting-button').removeClass('top');
        }else{
           $('.header-white .top-setting').addClass('slide');
           $('.top-seting-button').addClass('top');
        }
        return false;
    });
    }
    
    $('.search button').on( "click", function() {
           if ($('.header-white .search input').hasClass('right-slide')) {
               $('.header-white .search input').removeClass('right-slide');
           }else{
               $('.header-white .search input').addClass('right-slide');
           }
           return false;
       }); 
                 
    $('.simple-logo .search button').on( "click", function() {
           if ($('.header-white.simple-logo .search').hasClass('show-field')) {
               $('.header-white.simple-logo .search').removeClass('show-field');
           }else{
               $('.header-white.simple-logo .search').addClass('show-field');
           }
           return false;
       });             
                 
          
       if ($(window).width() < 990) {  
        
       $('.fa-navicon, .close-mobile-menu').on( "click", function() {
           if ($('.header-white .mobile-nav').hasClass('mobile-transform')) {
               $('.header-white .mobile-nav').removeClass('mobile-transform');
           }else{
               $('.header-white .mobile-nav').addClass('mobile-transform');
           }
           return false;
       });
        
       $('.fa-navicon, .close-mobile-menu').on( "click", function() {
           if ($('.navigation').hasClass('transform-top')) {
               $('.navigation').removeClass('transform-top');
           }else{
               $('.navigation').addClass('transform-top');
           }
           return false;
       });
        
       $('.header-dark button').on( "click", function() {
           if ($('.header-dark .search').hasClass('slide-search')) {
               $('.header-dark .search').removeClass('slide-search');
           }else{
               $('.header-dark .search').addClass('slide-search');
           }
           return false;
       });
        
       $('.fa-navicon, .close-mobile-menu').on( "click", function() {
           if ($('.header-white.simple-logo .width-25-right').hasClass('simple-slide')) {
               $('.header-white.simple-logo .width-25-right').removeClass('simple-slide');
           }else{
               $('.header-white.simple-logo .width-25-right').addClass('simple-slide');
           }
           return false;
       });    
    }
    
    $('.sub-menu > .fa').on( "click", function() {
        var LinkThis = $(this).parent();
        if (LinkThis.find('span').hasClass('slide-submenu')) {
            LinkThis.find('span').removeClass('slide-submenu');
             $(this).removeClass('fa-minus');
        }else {
            $('.sub-menu span').removeClass('slide-submenu');
            LinkThis.find('span').addClass('slide-submenu');
            $('.sub-menu > .fa').removeClass('fa-minus');
            $(this).addClass('fa-minus');
        }
        
        return false;
    });
    
    $('.arc-year > i').on( "click", function() {
        var YearSlide = $(this).parent();
        if (YearSlide.find('span').hasClass('slide-mounth')) {
            YearSlide.find('span').removeClass('slide-mounth');
            $('.arc-year').index(this).find('.fa').removeClass('visible');
        }else {
            $('.arc-year span').removeClass('slide-mounth');
            YearSlide.find('span').addClass('slide-mounth');
            $('.arc-year').index(this).find('.fa').addClass('visible');
        }
        
        return false;
    });
    
    
    var IndexInp = $('.input-wrap input').index(this);
    
    $('.input-wrap').on( "click", function() {
        if ($('.input-wrap').hasClass('color')){
        $(this).find('.fa').removeClass('color'); }
        else{
        $('.input-wrap .fa').removeClass('color')    
         $(this).find('.fa').addClass('color');
        }
    });
    
    

    $('.arch-points').on( "click", function() {
        $('.archive-baner-ajax').show(500);
        $(this).hide();
    });
    
   //////////////////////////SCROLL BAR/////////////////////////////////
    
    // $('#scroll-box').scrollbox({
    //   direction: 'h',
    //   linear: true,
    //   step: 1,
    //   delay: 0,
    //   speed: 50,
    //   queue: 'scroll-box-queue'
    // });
    
    
})(jQuery);                 
