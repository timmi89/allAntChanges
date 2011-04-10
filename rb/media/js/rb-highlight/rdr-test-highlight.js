(function($){

  var hostSelector = ".rdr-345c1dfd92c4f46eca2f29adab9ce8cf, .rdr-7e735f21369fc39546bdbaadc953ee4b",  //testing on our rb local site

  hostTargetText = ['the'], //a string, or an array of strings
  topContainerSelector = "body", // todo: not used anymore - use offsetParent
  $hostNode = $(hostSelector).eq(0), //really this should be a unique id, but if not, just select the first one.
  $hostClone = $hostNode.clone(),
  hostCloneCss = function() {
  	return {
  		'position':'absolute',
  		'top': $hostNode.offset().top,
  		'left': $hostNode.offset().left,
  		'margin': '0',
  		'color':'transparent'
  	}
  };
   
  //convert to straight text
  //note - we'll want to do this later but we have to check first to make sure all the nodes are inline and the same size.
  //$hostClone.html($hostClone.text());

  if (hostTargetText){
  	//start with cloned style from $hostNode
    //NOTE: requires improvedCSS.js  http://plugins.jquery.com/node/8726/release
    $hostClone.css($hostNode.css());

  	// then absolute position it on body with offset
    $hostClone.appendTo(topContainerSelector).css( hostCloneCss() );
   
    $hostClone.SearchHighlight({
      keys: hostTargetText,
      exact: "whole",
      style_name: 'rdr_highlight rdr_highlight' //the second one will have a number appended to it
    });

  }

})($R)