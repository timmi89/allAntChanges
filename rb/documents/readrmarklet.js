/*****  ****/
// bookmarklet code rdr_getScript()
// (credit) more or less stolen form jquery core and adapted by paul irish

(function(){
  function rdr_getScript(id,url,success){
    var head = document.getElementsByTagName("head")[0], done = false;
    var script = document.createElement("script");
    script.src = url;
    if(id){
        script.id = id;
    }

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
  var script = "http://local.readrboard.com:8081/static/engage.js?bookmarklet=true";
  //var script = "http://www.readrboard.com/static/engage.js?bookmarklet=true";
  var id="readrboardscript";
  rdr_getScript(id, script, function(){ 
    //callback not used
  });
})();

//todo: add a check to make sure we only add the script once.


//for testing on local (with and without javascript:)
//setting the id to the src helps engage.js?bookmarklet=true auto-detect if we're offline
    javascript:(function(){function rdr_getScript(id,url,success){var head=document.getElementsByTagName("head")[0],done=false;var script=document.createElement("script");script.src=url;if(id){script.id=id}script.onload=script.onreadystatechange=function(){if(!done&&(!this.readyState||this.readyState=="loaded"||this.readyState=="complete")){done=true;success()}};head.appendChild(script)}var script="http://local.readrboard.com:8081/static/engage.js?bookmarklet=true";var id="readrboardscript";rdr_getScript(id,script,function(){})})();
    //escaped
    javascript:(function(){function%20rdr_getScript(id,url,success){var%20head=document.getElementsByTagName("head")[0],done=false;var%20script=document.createElement("script");script.src=url;if(id){script.id=id}script.onload=script.onreadystatechange=function(){if(!done&&(!this.readyState||this.readyState=="loaded"||this.readyState=="complete")){done=true;success()}};head.appendChild(script)}var%20script="http://local.readrboard.com:8081/static/engage.js?bookmarklet=true";var%20id="readrboardscript";rdr_getScript(id,script,function(){})})();

    (function(){function%20rdr_getScript(id,url,success){var%20head=document.getElementsByTagName("head")[0],done=false;var%20script=document.createElement("script");script.src=url;if(id){script.id=id}script.onload=script.onreadystatechange=function(){if(!done&&(!this.readyState||this.readyState=="loaded"||this.readyState=="complete")){done=true;success()}};head.appendChild(script)}var%20script="http://local.readrboard.com:8081/static/engage.js?bookmarklet=true";var%20id="readrboardscript";rdr_getScript(id,script,function(){})})();

//live version (note that if you use this - it will start auto-generating groups, so don't use it till we're ready)

    javascript:(function(){function rdr_getScript(id,url,success){var head=document.getElementsByTagName("head")[0],done=false;var script=document.createElement("script");script.src=url;if(id){script.id=id}script.onload=script.onreadystatechange=function(){if(!done&&(!this.readyState||this.readyState=="loaded"||this.readyState=="complete")){done=true;success()}};head.appendChild(script)}var script="http://www.readrboard.com/static/engage.js?bookmarklet=true";var id="readrboardscript";rdr_getScript(id,script,function(){})})();
    //escaped
    javascript:(function(){function%20rdr_getScript(id,url,success){var%20head=document.getElementsByTagName("head")[0],done=false;var%20script=document.createElement("script");script.src=url;if(id){script.id=id}script.onload=script.onreadystatechange=function(){if(!done&&(!this.readyState||this.readyState=="loaded"||this.readyState=="complete")){done=true;success()}};head.appendChild(script)}var%20script="http://www.readrboard.com/static/engage.js?bookmarklet=true";var%20id="readrboardscript";rdr_getScript(id,script,function(){})})();

    (function(){function%20rdr_getScript(id,url,success){var%20head=document.getElementsByTagName("head")[0],done=false;var%20script=document.createElement("script");script.src=url;if(id){script.id=id}script.onload=script.onreadystatechange=function(){if(!done&&(!this.readyState||this.readyState=="loaded"||this.readyState=="complete")){done=true;success()}};head.appendChild(script)}var%20script="http://www.readrboard.com/static/engage.js?bookmarklet=true";var%20id="readrboardscript";rdr_getScript(id,script,function(){})})();

    //trying the aws version instead
    javascript:(function(){function%20rdr_getScript(id,url,success){var%20head=document.getElementsByTagName("head")[0],done=false;var%20script=document.createElement("script");script.src=url;if(id){script.id=id}script.onload=script.onreadystatechange=function(){if(!done&&(!this.readyState||this.readyState=="loaded"||this.readyState=="complete")){done=true;success()}};head.appendChild(script)}var%20script="http://s3.amazonaws.com/readrboard/engage.js?bookmarklet=true";var%20id="readrboardscript";rdr_getScript(id,script,function(){})})();


//-----------------------------------
//regex to look for logs
/*
    [^se ^_ ^//]log\(
*/



//-----------------------------------
//css regex for widget.css
/*

find:
(?<!\<important\>)(?<!;);(?!;)

replace:
 !important
//note the space before the '!' - you need that.

*/
