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

javascript:(function(){function getScript(url,success){var head=document.getElementsByTagName("head")[0],done=false;var script=document.createElement("script");script.src=url;script.onload=script.onreadystatechange=function(){if(!done&&(!this.readyState||this.readyState=="loaded"||this.readyState=="complete")){done=true;success();}};head.appendChild(script);}
var script="http://localhost:8080/widget/test/";getScript(script,function(){});})();

