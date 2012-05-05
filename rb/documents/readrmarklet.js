/*****  ****/
// bookmarklet code rdr_getScript()
// (credit) more or less stolen form jquery core and adapted by paul irish

(function(){
  function rdr_getScript(url,success){
    var head = document.getElementsByTagName("head")[0], done = false;
    var script = document.createElement("script");
    
    //setting an id helps engage.js know whether it's the local version or not.
    //replace "/" because it's not technically a valid char for an id
    script.id=url.replace(/\//g,"-");
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
  var script = "http://local.readrboard.com:8080/static/engage.js";
  //var script = "http://www.readrboard.com/static/engage.js";
  rdr_getScript( script, function(){ 
    //callback not used
  });
})();


//todo: add a check to make sure we only add the script once.


//for testing on local (with and without javascript:)
//setting the id to the src helps engage.js auto-detect if we're offline
    javascript:(function(){function rdr_getScript(url,success){var head=document.getElementsByTagName("head")[0],done=false;var script=document.createElement("script");script.src=url;script.id=url.replace(/\//g,"-");script.onload=script.onreadystatechange=function(){if(!done&&(!this.readyState||this.readyState=="loaded"||this.readyState=="complete")){done=true;success();}};head.appendChild(script);}var script="http://local.readrboard.com:8080/static/engage.js";rdr_getScript(script,function(){});})();
    //escaped
    javascript:(function(){function%20rdr_getScript(url,success){var%20head=document.getElementsByTagName("head")[0],done=false;var%20script=document.createElement("script");script.src=url;script.id=url.replace(/\//g,"-");script.onload=script.onreadystatechange=function(){if(!done&&(!this.readyState||this.readyState=="loaded"||this.readyState=="complete")){done=true;success();}};head.appendChild(script);}var%20script="http://local.readrboard.com:8080/static/engage.js";rdr_getScript(script,function(){});})();

    (function(){function rdr_getScript(url,success){var head=document.getElementsByTagName("head")[0],done=false;var script=document.createElement("script");script.src=url;script.id=url.replace(/\//g,"-");script.onload=script.onreadystatechange=function(){if(!done&&(!this.readyState||this.readyState=="loaded"||this.readyState=="complete")){done=true;success();}};head.appendChild(script);}var script="http://local.readrboard.com:8080/static/engage.js";rdr_getScript(script,function(){});})();

//live version (note that if you use this - it will start auto-generating groups, so don't use it till we're ready)

    javascript:(function(){function rdr_getScript(url,success){var head=document.getElementsByTagName("head")[0],done=false;var script=document.createElement("script");script.src=url;script.id=url.replace(/\//g,"-");script.onload=script.onreadystatechange=function(){if(!done&&(!this.readyState||this.readyState=="loaded"||this.readyState=="complete")){done=true;success();}};head.appendChild(script);}var script="http://www.readrboard.com/static/engage.js";rdr_getScript(script,function(){});})();
    //escaped
    javascript:(function(){function%20rdr_getScript(url,success){var%20head=document.getElementsByTagName("head")[0],done=false;var%20script=document.createElement("script");script.src=url;script.id=url.replace(/\//g,"-");script.onload=script.onreadystatechange=function(){if(!done&&(!this.readyState||this.readyState=="loaded"||this.readyState=="complete")){done=true;success();}};head.appendChild(script);}var%20script="http://www.readrboard.com/static/engage.js";rdr_getScript(script,function(){});})();

    (function(){function rdr_getScript(url,success){var head=document.getElementsByTagName("head")[0],done=false;var script=document.createElement("script");script.src=url;script.id=url.replace(/\//g,"-");script.onload=script.onreadystatechange=function(){if(!done&&(!this.readyState||this.readyState=="loaded"||this.readyState=="complete")){done=true;success();}};head.appendChild(script);}var script="http://www.readrboard.com/static/engage.js";rdr_getScript(script,function(){});})();

//trying the aws version instead
javascript:(function(){function%20rdr_getScript(url,success){var%20head=document.getElementsByTagName("head")[0],done=false;var%20script=document.createElement("script");script.src=url;script.id=url.replace(/\//g,"-");script.onload=script.onreadystatechange=function(){if(!done&&(!this.readyState||this.readyState=="loaded"||this.readyState=="complete")){done=true;success();}};head.appendChild(script);}var%20script="http://s3.amazonaws.com/readrboard/engage.js";rdr_getScript(script,function(){});})();
