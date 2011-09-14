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


	 });
}(jQuery));