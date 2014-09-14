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

		$('#sns_buttons').cycle({
			fx: 'scrollDown',
			easing: 'swing',
			speed:	400,
			timeout: 4000
		});


		var sandBoxCheck = 0;

		/*slideshow code start*/
		// $('#promoGallery').cycle({
		// 	/*see http://jquery.malsup.com/cycle/options.html*/
		// 	/*
		// 	fx: 'myUncover',
		// 	*/
		// 	fx: 'scrollLeft',
		// 	easing: 'swing',
		// 	direction: 'left',
		// 	speed:	600,
		// 	timeout: 4000,
		// 	pause:	0, /*enable pause on hover*/
		// 	pager: "#promoControlsInnerWrap",
		// 	pagerAnchorBuilder: function(idx, slide) {
		// 		var typeArr = ["Image", "Text", "Video"];
		// 		var $pager = $('<div />').addClass('pagerDiv'),
		// 			$a = $('<a href="#" />').addClass('pager'+typeArr[idx]).appendTo($pager),
		// 			$img = $('<img src="/static/site/images/blank.png" alt="Show '+typeArr[idx]+' Example" />').appendTo($a);
				
		// 		return $pager;
		// 	},
		// 	before: function(){
		// 		//just do this everytime - it's a little 'wastefull' but so what.  It's simpler - catches the first time they init.
		// 		hideSandboxStuffForMedia();
		// 	},
		// 	after: function(){
		// 		//do it again to hide shit that caught if you hovered durring the transition. 
		// 		//todo: this could be done nicer.  Considering putting a sub-sandbox into the slide.
		// 		hideSandboxStuffForMedia();

		// 		//sandbox starts off hidden to prevent initial fouc, so look for it here, and if it's loaded, show it.

		// 		var $sandbox = $('#rdr_sandbox');
		// 		if($sandbox.length){
		// 			sandBoxCheck = true;
		// 			$('#rdr_sandbox').show();
		// 		}
		// 		if(sandBoxCheck !== true) return;
		// 		//else
				
		// 		//find the mediaContainer if it exists on this slide (the text slide won't have one)
		// 		var $thisMediaContainer = $(this).find('img.rdr-hashed, iframe.rdr-hashed').eq(0);
		// 		if($thisMediaContainer.length){
		// 			updateSandboxStuffForMedia($thisMediaContainer);
		// 		}
		// 	}
		// });
		
		function hideSandboxStuffForMedia(){
			//hide all the sandbox components for this media
			var $mediaContainers = $('#promoGallery').find('img.rdr-hashed, iframe.rdr-hashed');
			$mediaContainers.each(function(){
				//we need to use the $R jquery to get the data instead of the one on this page
				var hash = $R(this).data('hash');
				$('#rdr_actionbar_'+hash).hide();
				$('#rdr_container_tracker_'+hash).hide();
				$('#rdr_indicator_details_'+hash).hide();				
			});
		}
		function updateSandboxStuffForMedia($thisMediaContainer){	
			//we need to use the $R jquery to get the data instead of the one on this page
			//todo: This won't work later because we will hide this in a closure later.
			var hash = $R($thisMediaContainer[0]).data('hash');
			ANTN.actions.indicators.utils.updateContainerTracker(hash);
		}

		$("#promoControls a").click(function(e) {
			$(this).blur();
		});
		
		$("#promoControls").fadeIn();
		/*chrome was FOUCing this without this hack - hidden initially*/
		$('#promoGallery iframe').show();
		/*slideshow code end*/
		//reveal after load

	});
}(jQuery));