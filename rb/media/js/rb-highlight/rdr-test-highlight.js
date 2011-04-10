(function($){

var hostSelector = ".rdr-345c1dfd92c4f46eca2f29adab9ce8cf",  //testing on our rb local site

hostTargetText = ['kit'], //a string, or an array of strings
topContainerSelector = "body", // todo: not used anymore - use offsetParent

$pin,
pinSettings = {
	id:"pin",
	offset:null,
	html: "I may look inline, but i'm a new cloned node positioned absolute",
	prepend: true
},
$hostNode = $(hostSelector).eq(0), //really this should be a unique id, but if not, just select the first one.
$hostClone = $hostNode.clone(),
hostCloneSettings = {
	offset: $hostNode.offset()
},

testFlowSamplerCSS = {
	'position':'relative',
	'display':'inline',
	'margin':'0',
	'padding':'0',
	'border':'none',
	'height':'0',
	'width':'0'
},

hostCloneCss = function() {
	return {
		'position':'absolute',
		'top': hostCloneSettings.offset.top,
		'left': hostCloneSettings.offset.left,
		'margin': '0',
		'color':'transparent'
	}
};
 
function stealHostStyle($hostClone, $hostNode){
	$hostClone.css({
		'color': $hostNode.css('color'),
		'font-size': $hostNode.css('font-size'),
		'font-family': $hostNode.css('font-family'),
		'line-height': $hostNode.css('line-height'),
		'font-weight': $hostNode.css('font-weight'),
		'font-stretch': $hostNode.css('font-stretch'),
		'width': $hostNode.css('width'),
		'letter-spacing': $hostNode.css('letter-spacing')

		//any other that we might need.  Is there a css object that we iterate over?  Checkout jQuery code for css() later
	});
}

function pinAdjustStyle(){
	$pin.css({
		'width': '400px'
	})
}


//make pin
// ? normally we would figure out if we were inside a span, then use div, else use span. (like  single or double quote 'escaping')

//convert to straight text
//$hostClone.html($hostClone.text());

var $highlight;

if (hostTargetText){
	
	//$highlight = $hostClone.find('.highlight');
  //	$highlight.removeClass('highlight');



	//start with cloned style from $hostNode
  $hostClone.css($hostNode.css());

	// then absolute position it on body with offset
  $hostClone.appendTo(topContainerSelector).css( hostCloneCss() );
 
  
  $hostClone.SearchHighlight({
    keys: hostTargetText,
    exact: "whole",
    style_name: 'rdr_highlight rdr_highlight' //the second one will have a number appended to it
  });

  /*
	var highlightSettings={
		offset: $highlight.offset()
	};
  

	var highlightCSS = function() {
		return {
			'position':'absolute',
			'top': highlightSettings.offset.top,
			'left': highlightSettings.offset.left,
			'margin': '0'
		}
	};
*/
/*
	//start with cloned style from $highlight that is embedded in the $hostClone - make css explicit
	$highlight.css($highlight.css());

	$hostClone.remove();

	$highlight.appendTo(topContainerSelector).css( highlightCSS() );

	$highlight.addClass('highlight');
*/
	/*
	//todo this assumes it occurs only once - be more robust later
	var textStart = $hostClone.text().split(hostTargetText)[0],
	textEnd = $hostClone.text().split(hostTargetText)[1],
	targetTextSplice = $('<span></span>').attr('id',"textSplice_"+ pinSettings.id);

	$hostClone.html(textStart + targetTextSplice + textEnd);
	*/
}
//not needed anymore
//stealHostStyle($hostClone, $hostNode);


/*
if (pinSettings.prepend) {
	//$pin.prependTo($hostNode);
	//hostClone
}
else{
	$pin.appendTo($hostNode);
}
$pin.css(testFlowSamplerCSS);


pinSettings.offset = $pin.offset();

$pin
	.appendTo(topContainer)
	.css( pinCss() )
	.html(pinSettings.html);	

pinAdjustStyle();
*/

})($R)