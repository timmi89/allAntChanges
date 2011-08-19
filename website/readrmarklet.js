/*****  ****/
// bookmarklet code getScript()
// (credit) more or less stolen form jquery core and adapted by paul irish

(function(){
  function getScript(url,success){
    var head = document.getElementsByTagName("head")[0], done = false;
    var script = document.createElement("script");
    script.src = url;
    // Attach handlers for all browsers
    script.onload = script.onreadystatechange = function(){
      if ( !done && (!this.readyState ||
          this.readyState == "loaded" || this.readyState == "complete") ) {
        done = true;
        success();
      }
    };
    head.appendChild(script);
  }
  var script = "http://localhost:8080/widget/test/";
  getScript( script, function(){ 
    //callback not used
  });
})();


/*readrmarklet*/

javascript:(function(){function getScript(url,success){var w =window; window.location = "http://google.com"; alert(w); var head=document.getElementsByTagName("head")[0],done=false;var script=document.createElement("script");script.src=url;script.onload=script.onreadystatechange=function(){if(!done&&(!this.readyState||this.readyState=="loaded"||this.readyState=="complete")){done=true;success();}};head.appendChild(script);}
var script="http://localhost:8080/widget/test/";getScript(script,function(){});})();

javascript:(function(){function getScript(url,success){var w =window; w.location = "http://google.com"; alert(w); var head=window.document.getElementsByTagName("head")[0],done=false;var script=document.createElement("script");script.src=url;script.onload=script.onreadystatechange=function(){if(!done&&(!this.readyState||this.readyState=="loaded"||this.readyState=="complete")){done=true;success();}};head.appendChild(script);}
var script="http://localhost:8080/widget/test/";getScript(script,function(){});})();




//scroll to hilight demo
//for this demo purpose, just invade the $ namespace.

if($R){
    $ = $R; //namespace slaughter!
}

var containerClass ='rdr-78d0b32f826b11bbf3bd8e9efc90ec01',
$container = $('.'+containerClass),
serialRange = "1:8,1:29{9ccdb1b8}";

var oldSelState = selState || null;
if (oldSelState){
    $().selectionographer('hilite',oldSelState.idx, 'off')
}
var selState = $container.selectionographer('save',{serialRange:serialRange});
console.log(selState)
$().selectionographer('hilite',selState.idx, 'toggle')

var targetOffset = $container.offset().top,
windowPadding = 50,
scrollTarget = targetOffset-windowPadding || 0;

$('html,body')
.animate({scrollTop: scrollTarget}, 1000);

