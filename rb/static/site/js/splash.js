(function($){
	 $(document).ready(function() {

	 	$('#blurbMenu li').click(function(){
	 		$(this).addClass('selected').siblings().removeClass('selected');
	 		
	 		var order = $(this).index();
	 		console.log(order);

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

	 	/*slideshow code start*/
 	    $('#promoGallery').cycle({
		    /*see http://jquery.malsup.com/cycle/options.html*/
		    /*
		    fx: 'myUncover',
		    */
		    fx: 'scrollLeft',
		    direction: 'left',
		    speed:   600,
		    timeout: 4000,
		    next:   '.promoNext',
		    prev:   '.promoPrev',
		    pause:   1, /*enable pause on hover*/
		    random: 0, /*change to 1 if we want it to be randomized*/
		    onPrevNextEvent: function (isNext) {
		        $('#promoGallery').cycle('pause');
		        $(".promoPlay").show();
		        $(".promoPause").hide();

		        //hack to allow prev and next to have different transitions
		        if (isNext) {
		            $('#promoGallery').data('direction', 'left')
		        }else{
		            $('#promoGallery').data('direction', 'right')
		        }
		    }
		});
		    
		$(".promoPlay").hide(); //starts off with pause shown and play hidden

		$(".promoPlayPause").click(function (e) {
		    $('#promoGallery').cycle('toggle');

		    $(".promoPlay").toggle();
		    $(".promoPause").toggle();
		    return false;
		});
		$("#promoControls a").click(function(e) {
		    $(this).blur();
		});
		/*chrome was FOUCing this without this hack - hidden initially*/
		$('#promoGallery iframe').show();
		/*slideshow code end*/

	});
}(jQuery));