(function($){
	 $(document).ready(function() {

	 	$('#blurbMenu li').click(function(){
	 		$(this).addClass('selected').siblings().removeClass('selected');
	 		
	 		var order = $(this).index();

	 		var $thisMenuBody = $('#blurbBody').children().eq(order);
	 		$thisMenuBody.siblings().fadeOut( 100, function(){
	 			$(this).removeClass('selected');
	 			$thisMenuBody.fadeIn( 100, function(){
	 				$(this).addClass('selected');
		 		});
	 		});
	 	}).hover(
		 	function(){
	 			$(this).addClass('hover');
	 		},
	 		function(){
	 			$(this).removeClass('hover');
	 		}
	 	);

		$('.partnerLogos li').hover(
		 	function(){
	 			$(this).addClass('hover');
	 			$(this).find('img.greyscaleImg').hide();
	 			$(this).find('img.colorImg').show();
	 		},
	 		function(){
	 			$(this).removeClass('hover');
	 			$(this).find('img.colorImg').hide();
	 			$(this).find('img.greyscaleImg').show();
	 		}
	 	);	

	 	/* rotate the like and +1 buttons */
	 // 	var cycleLikes = setInterval( function() { 
		// 	$('#sns_buttons img').fadeToggle(1000); 
		// }, 4000 );

		$('#sns_buttons').cycle({
			fx: 'scrollDown',
			easing: 'swing',
		    speed:   400,
		    timeout: 4000
		});

		$('#splashAnnounce h2').show();

	 	/*slideshow code start*/
 	    $('#promoGallery').cycle({
		    /*see http://jquery.malsup.com/cycle/options.html*/
		    /*
		    fx: 'myUncover',
		    */
		    fx: 'scrollLeft',
		    easing: 'swing',
		    direction: 'left',
		    speed:   600,
		    timeout: 4000,
		    pause:   0, /*enable pause on hover*/
		    pager: "#promoControlsInnerWrap",
	        pagerAnchorBuilder: function(idx, slide) {
	        	var typeArr = ["Image", "Text", "Video"];
	        	var $pager = $('<div />').addClass('pagerDiv'),
	        		$a = $('<a href="#" />').addClass('pager'+typeArr[idx]).appendTo($pager),
	        		$img = $('<img src="/static/site/images/blank.png" alt="Show '+typeArr[idx]+' Example" />').appendTo($a);
	       
				return $pager;
			},
		    before: function(){
		    	var $mediaContainer = $(this).find('img.rdr-hashed, iframe.rdr-hashed'),
		    		hash;

		    	if(!$mediaContainer.length) return;
		    	//else

				$('.rdr_indicator_details').hide();
				$('.rdr_indicator_body').hide();

		    	/*
		    	hash = $mediaContainer.data('hash')
		    		hash = 
				*/
		    },
			after: function(){
		    },
			onPrevNextEvent: function (isNext) {
		        $('#promoGallery').cycle('pause');
		        
		        //hack to allow prev and next to have different transitions
		        /*
		        if (isNext) {
		            $('#promoGallery').data('direction', 'left')
		        }else{
		            $('#promoGallery').data('direction', 'right')
		        }
		        */
		    }
		});
		$('#promoGallery').hover(
			function(){
				$(this).cycle('pause');
			},
			function(){
				//don't do this -prob annoying anyway, but especially dont do it because the widget steals the hover
				/*
				$(this).cycle('resume');
		        $(".promoPlay").hide();
		        $(".promoPause").show();
		        */
			}
		);

		$("#promoControls a").click(function(e) {
		    $(this).blur();
		});
		$("#promoControls").fadeIn();
		
		/*chrome was FOUCing this without this hack - hidden initially*/
		$('#promoGallery iframe').show();
		/*slideshow code end*/

		//reveal after load
		$('#markerAnnotationLearnMore').fadeIn();

	});
}(jQuery));