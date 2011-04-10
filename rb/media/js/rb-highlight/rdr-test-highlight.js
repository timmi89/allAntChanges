(function($){

  var hostSelector = ".rdr-345c1dfd92c4f46eca2f29adab9ce8cf, .rdr-7e735f21369fc39546bdbaadc953ee4b",  //testing on our rb local site

  $hostNode = $(hostSelector); //really this should be a unique id, but if not, just select the first one.
   
  $hostNode.SearchHighlight({
    keys: "the",
    exact: "whole",
    style_name: 'rdr_highlight rdr_highlight', //the second one will have a number appended to it
    clone:true
  });

})($R)