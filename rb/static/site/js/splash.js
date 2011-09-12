(function($){
	 $(document).ready(function() {
	 	$('#blurbMenu li').click(function(){
	 		$(this).addClass('selected').siblings().removeClass('selected');
	 		
	 		var order = $(this).index();
	 		console.log(order);

	 		var $thisMenuBody = $('#blurbBody').children().eq(order);
	 		$thisMenuBody.siblings().fadeOut( 100, function(){
	 			$(this).removeClass('selected')
	 			$thisMenuBody.fadeIn( 100, function(){
	 				$(this).addClass('selected')
		 		});
	 		});
	 	}).hover(
		 	function(){
	 			$(this).addClass('hover')	
	 		},
	 		function(){
	 			$(this).removeClass('hover')	
	 		}
	 	);
	 });
}(jQuery));