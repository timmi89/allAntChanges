/*****  ****/
// bookmarklet code rdr_getScript()
// (credit) more or less stolen form jquery core and adapted by paul irish

(function(){
  function rdr_getScript(url,success){
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
  var script = "http://local.readrboard.com:8080/widget/demo/";
  rdr_getScript( script, function(){ 
    //callback not used
  });
})();


//question: should '/widget/demo/' be '/widget/default/' I thought right?  But default doesn't seem to be working..

/*readrmarklet for local.readrboard.com*/
javascript:(function(){function rdr_getScript(url,success){var head=document.getElementsByTagName("head")[0],done=false;var script=document.createElement("script");script.src=url;script.onload=script.onreadystatechange=function(){if(!done&&(!this.readyState||this.readyState=="loaded"||this.readyState=="complete")){done=true;success();}};head.appendChild(script);}
var script="http://local.readrboard.com:8080/widget/default/";rdr_getScript(script,function(){});})();

/*readrmarklet for live on the web*/
javascript:(function(){function rdr_getScript(url,success){var head=document.getElementsByTagName("head")[0],done=false;var script=document.createElement("script");script.src=url;script.onload=script.onreadystatechange=function(){if(!done&&(!this.readyState||this.readyState=="loaded"||this.readyState=="complete")){done=true;success();}};head.appendChild(script);}var script="http://www.readrboard.com/widget/default/";rdr_getScript(script,function(){});})();
