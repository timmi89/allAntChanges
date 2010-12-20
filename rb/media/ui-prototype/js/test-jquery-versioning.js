// ignore this file for now...

console.log($)
var jQueryVersion = "1.4.4",
RDR, //our global RDR object
$R = {}, //init var: our clone of jQuery
client$ = {}; //init var: clients copy of jQuery

//Our Readrboard function that builds the RDR object which gets returned into the global scope.
//This function gets called above in
function readrBoard($R){
    var $ = $R;
    var RDR = RDR ? RDR : {}
    // none of this obj's properties are definite.  just jotting down a few ideas.
    RDR = {};
    return RDR;
}

//loadScript copied from http://www.logiclabz.com/javascript/dynamically-loading-javascript-file-with-callback-event-handlers.aspx
function loadScript(sScriptSrc,callbackfunction) {
    var oHead = document.getElementsByTagName('head')[0];
    if(oHead) {
        var oScript = document.createElement('script');

        oScript.setAttribute('src',sScriptSrc);
        oScript.setAttribute('type','text/javascript');

        var loadFunction = function() {
            if (this.readyState == 'complete' || this.readyState == 'loaded') {
                callbackfunction();
            }
        };
        oScript.onload = callbackfunction;
        oScript.onreadystatechange = loadFunction;
        oHead.appendChild(oScript);
    }
}




console.log( $().jquery );
console.log( $().jquery );



//pretend that we actually want version 1.4.3 (just so we can easily test that it's different from the dc client page which is already 1.4.4 )
//get our copy of $ and noConflict it.

loadScript("https://ajax.googleapis.com/ajax/libs/jquery/1.4.3/jquery.min.js",function(){
    console.log( $().jquery );
    var jQuery_1_4_3 = $.noConflict(true);
    console.log( $().jquery );
});


console.log( $().jquery );

$RDependentFunctions($R);

function $RDependentFunctions($R){
    //called after jQuery is either verified, or loaded

    //initiate our RDR object
    RDR = readrBoard($R);

//testing:

}
