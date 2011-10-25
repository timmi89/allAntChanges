/*!
 * jQuery JavaScript Library v1.4.2
 * http://jquery.com/
 *
 * Copyright 2010, John Resig
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * Includes Sizzle.js
 * http://sizzlejs.com/
 * Copyright 2010, The Dojo Foundation
 * Released under the MIT, BSD, and GPL Licenses.
 *
 * Date: Sat Feb 13 22:33:48 2010 -0500
 */
(function(A,w){function ma(){if(!c.isReady){try{s.documentElement.doScroll("left")}catch(a){setTimeout(ma,1);return}c.ready()}}function Qa(a,b){b.src?c.ajax({url:b.src,async:false,dataType:"script"}):c.globalEval(b.text||b.textContent||b.innerHTML||"");b.parentNode&&b.parentNode.removeChild(b)}function X(a,b,d,f,e,j){var i=a.length;if(typeof b==="object"){for(var o in b)X(a,o,b[o],f,e,d);return a}if(d!==w){f=!j&&f&&c.isFunction(d);for(o=0;o<i;o++)e(a[o],b,f?d.call(a[o],o,e(a[o],b)):d,j);return a}return i?
e(a[0],b):w}function J(){return(new Date).getTime()}function Y(){return false}function Z(){return true}function na(a,b,d){d[0].type=a;return c.event.handle.apply(b,d)}function oa(a){var b,d=[],f=[],e=arguments,j,i,o,k,n,r;i=c.data(this,"events");if(!(a.liveFired===this||!i||!i.live||a.button&&a.type==="click")){a.liveFired=this;var u=i.live.slice(0);for(k=0;k<u.length;k++){i=u[k];i.origType.replace(O,"")===a.type?f.push(i.selector):u.splice(k--,1)}j=c(a.target).closest(f,a.currentTarget);n=0;for(r=
j.length;n<r;n++)for(k=0;k<u.length;k++){i=u[k];if(j[n].selector===i.selector){o=j[n].elem;f=null;if(i.preType==="mouseenter"||i.preType==="mouseleave")f=c(a.relatedTarget).closest(i.selector)[0];if(!f||f!==o)d.push({elem:o,handleObj:i})}}n=0;for(r=d.length;n<r;n++){j=d[n];a.currentTarget=j.elem;a.data=j.handleObj.data;a.handleObj=j.handleObj;if(j.handleObj.origHandler.apply(j.elem,e)===false){b=false;break}}return b}}function pa(a,b){return"live."+(a&&a!=="*"?a+".":"")+b.replace(/\./g,"`").replace(/ /g,
"&")}function qa(a){return!a||!a.parentNode||a.parentNode.nodeType===11}function ra(a,b){var d=0;b.each(function(){if(this.nodeName===(a[d]&&a[d].nodeName)){var f=c.data(a[d++]),e=c.data(this,f);if(f=f&&f.events){delete e.handle;e.events={};for(var j in f)for(var i in f[j])c.event.add(this,j,f[j][i],f[j][i].data)}}})}function sa(a,b,d){var f,e,j;b=b&&b[0]?b[0].ownerDocument||b[0]:s;if(a.length===1&&typeof a[0]==="string"&&a[0].length<512&&b===s&&!ta.test(a[0])&&(c.support.checkClone||!ua.test(a[0]))){e=
true;if(j=c.fragments[a[0]])if(j!==1)f=j}if(!f){f=b.createDocumentFragment();c.clean(a,b,f,d)}if(e)c.fragments[a[0]]=j?f:1;return{fragment:f,cacheable:e}}function K(a,b){var d={};c.each(va.concat.apply([],va.slice(0,b)),function(){d[this]=a});return d}function wa(a){return"scrollTo"in a&&a.document?a:a.nodeType===9?a.defaultView||a.parentWindow:false}var c=function(a,b){return new c.fn.init(a,b)},Ra=A.jQuery,Sa=A.$,s=A.document,T,Ta=/^[^<]*(<[\w\W]+>)[^>]*$|^#([\w-]+)$/,Ua=/^.[^:#\[\.,]*$/,Va=/\S/,
Wa=/^(\s|\u00A0)+|(\s|\u00A0)+$/g,Xa=/^<(\w+)\s*\/?>(?:<\/\1>)?$/,P=navigator.userAgent,xa=false,Q=[],L,$=Object.prototype.toString,aa=Object.prototype.hasOwnProperty,ba=Array.prototype.push,R=Array.prototype.slice,ya=Array.prototype.indexOf;c.fn=c.prototype={init:function(a,b){var d,f;if(!a)return this;if(a.nodeType){this.context=this[0]=a;this.length=1;return this}if(a==="body"&&!b){this.context=s;this[0]=s.body;this.selector="body";this.length=1;return this}if(typeof a==="string")if((d=Ta.exec(a))&&
(d[1]||!b))if(d[1]){f=b?b.ownerDocument||b:s;if(a=Xa.exec(a))if(c.isPlainObject(b)){a=[s.createElement(a[1])];c.fn.attr.call(a,b,true)}else a=[f.createElement(a[1])];else{a=sa([d[1]],[f]);a=(a.cacheable?a.fragment.cloneNode(true):a.fragment).childNodes}return c.merge(this,a)}else{if(b=s.getElementById(d[2])){if(b.id!==d[2])return T.find(a);this.length=1;this[0]=b}this.context=s;this.selector=a;return this}else if(!b&&/^\w+$/.test(a)){this.selector=a;this.context=s;a=s.getElementsByTagName(a);return c.merge(this,
a)}else return!b||b.jquery?(b||T).find(a):c(b).find(a);else if(c.isFunction(a))return T.ready(a);if(a.selector!==w){this.selector=a.selector;this.context=a.context}return c.makeArray(a,this)},selector:"",jquery:"1.4.2",length:0,size:function(){return this.length},toArray:function(){return R.call(this,0)},get:function(a){return a==null?this.toArray():a<0?this.slice(a)[0]:this[a]},pushStack:function(a,b,d){var f=c();c.isArray(a)?ba.apply(f,a):c.merge(f,a);f.prevObject=this;f.context=this.context;if(b===
"find")f.selector=this.selector+(this.selector?" ":"")+d;else if(b)f.selector=this.selector+"."+b+"("+d+")";return f},each:function(a,b){return c.each(this,a,b)},ready:function(a){c.bindReady();if(c.isReady)a.call(s,c);else Q&&Q.push(a);return this},eq:function(a){return a===-1?this.slice(a):this.slice(a,+a+1)},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},slice:function(){return this.pushStack(R.apply(this,arguments),"slice",R.call(arguments).join(","))},map:function(a){return this.pushStack(c.map(this,
function(b,d){return a.call(b,d,b)}))},end:function(){return this.prevObject||c(null)},push:ba,sort:[].sort,splice:[].splice};c.fn.init.prototype=c.fn;c.extend=c.fn.extend=function(){var a=arguments[0]||{},b=1,d=arguments.length,f=false,e,j,i,o;if(typeof a==="boolean"){f=a;a=arguments[1]||{};b=2}if(typeof a!=="object"&&!c.isFunction(a))a={};if(d===b){a=this;--b}for(;b<d;b++)if((e=arguments[b])!=null)for(j in e){i=a[j];o=e[j];if(a!==o)if(f&&o&&(c.isPlainObject(o)||c.isArray(o))){i=i&&(c.isPlainObject(i)||
c.isArray(i))?i:c.isArray(o)?[]:{};a[j]=c.extend(f,i,o)}else if(o!==w)a[j]=o}return a};c.extend({noConflict:function(a){A.$=Sa;if(a)A.jQuery=Ra;return c},isReady:false,ready:function(){if(!c.isReady){if(!s.body)return setTimeout(c.ready,13);c.isReady=true;if(Q){for(var a,b=0;a=Q[b++];)a.call(s,c);Q=null}c.fn.triggerHandler&&c(s).triggerHandler("ready")}},bindReady:function(){if(!xa){xa=true;if(s.readyState==="complete")return c.ready();if(s.addEventListener){s.addEventListener("DOMContentLoaded",
L,false);A.addEventListener("load",c.ready,false)}else if(s.attachEvent){s.attachEvent("onreadystatechange",L);A.attachEvent("onload",c.ready);var a=false;try{a=A.frameElement==null}catch(b){}s.documentElement.doScroll&&a&&ma()}}},isFunction:function(a){return $.call(a)==="[object Function]"},isArray:function(a){return $.call(a)==="[object Array]"},isPlainObject:function(a){if(!a||$.call(a)!=="[object Object]"||a.nodeType||a.setInterval)return false;if(a.constructor&&!aa.call(a,"constructor")&&!aa.call(a.constructor.prototype,
"isPrototypeOf"))return false;var b;for(b in a);return b===w||aa.call(a,b)},isEmptyObject:function(a){for(var b in a)return false;return true},error:function(a){throw a;},parseJSON:function(a){if(typeof a!=="string"||!a)return null;a=c.trim(a);if(/^[\],:{}\s]*$/.test(a.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,"@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,"]").replace(/(?:^|:|,)(?:\s*\[)+/g,"")))return A.JSON&&A.JSON.parse?A.JSON.parse(a):(new Function("return "+
a))();else c.error("Invalid JSON: "+a)},noop:function(){},globalEval:function(a){if(a&&Va.test(a)){var b=s.getElementsByTagName("head")[0]||s.documentElement,d=s.createElement("script");d.type="text/javascript";if(c.support.scriptEval)d.appendChild(s.createTextNode(a));else d.text=a;b.insertBefore(d,b.firstChild);b.removeChild(d)}},nodeName:function(a,b){return a.nodeName&&a.nodeName.toUpperCase()===b.toUpperCase()},each:function(a,b,d){var f,e=0,j=a.length,i=j===w||c.isFunction(a);if(d)if(i)for(f in a){if(b.apply(a[f],
d)===false)break}else for(;e<j;){if(b.apply(a[e++],d)===false)break}else if(i)for(f in a){if(b.call(a[f],f,a[f])===false)break}else for(d=a[0];e<j&&b.call(d,e,d)!==false;d=a[++e]);return a},trim:function(a){return(a||"").replace(Wa,"")},makeArray:function(a,b){b=b||[];if(a!=null)a.length==null||typeof a==="string"||c.isFunction(a)||typeof a!=="function"&&a.setInterval?ba.call(b,a):c.merge(b,a);return b},inArray:function(a,b){if(b.indexOf)return b.indexOf(a);for(var d=0,f=b.length;d<f;d++)if(b[d]===
a)return d;return-1},merge:function(a,b){var d=a.length,f=0;if(typeof b.length==="number")for(var e=b.length;f<e;f++)a[d++]=b[f];else for(;b[f]!==w;)a[d++]=b[f++];a.length=d;return a},grep:function(a,b,d){for(var f=[],e=0,j=a.length;e<j;e++)!d!==!b(a[e],e)&&f.push(a[e]);return f},map:function(a,b,d){for(var f=[],e,j=0,i=a.length;j<i;j++){e=b(a[j],j,d);if(e!=null)f[f.length]=e}return f.concat.apply([],f)},guid:1,proxy:function(a,b,d){if(arguments.length===2)if(typeof b==="string"){d=a;a=d[b];b=w}else if(b&&
!c.isFunction(b)){d=b;b=w}if(!b&&a)b=function(){return a.apply(d||this,arguments)};if(a)b.guid=a.guid=a.guid||b.guid||c.guid++;return b},uaMatch:function(a){a=a.toLowerCase();a=/(webkit)[ \/]([\w.]+)/.exec(a)||/(opera)(?:.*version)?[ \/]([\w.]+)/.exec(a)||/(msie) ([\w.]+)/.exec(a)||!/compatible/.test(a)&&/(mozilla)(?:.*? rv:([\w.]+))?/.exec(a)||[];return{browser:a[1]||"",version:a[2]||"0"}},browser:{}});P=c.uaMatch(P);if(P.browser){c.browser[P.browser]=true;c.browser.version=P.version}if(c.browser.webkit)c.browser.safari=
true;if(ya)c.inArray=function(a,b){return ya.call(b,a)};T=c(s);if(s.addEventListener)L=function(){s.removeEventListener("DOMContentLoaded",L,false);c.ready()};else if(s.attachEvent)L=function(){if(s.readyState==="complete"){s.detachEvent("onreadystatechange",L);c.ready()}};(function(){c.support={};var a=s.documentElement,b=s.createElement("script"),d=s.createElement("div"),f="script"+J();d.style.display="none";d.innerHTML="   <link/><table></table><a href='/a' style='color:red;float:left;opacity:.55;'>a</a><input type='checkbox'/>";
var e=d.getElementsByTagName("*"),j=d.getElementsByTagName("a")[0];if(!(!e||!e.length||!j)){c.support={leadingWhitespace:d.firstChild.nodeType===3,tbody:!d.getElementsByTagName("tbody").length,htmlSerialize:!!d.getElementsByTagName("link").length,style:/red/.test(j.getAttribute("style")),hrefNormalized:j.getAttribute("href")==="/a",opacity:/^0.55$/.test(j.style.opacity),cssFloat:!!j.style.cssFloat,checkOn:d.getElementsByTagName("input")[0].value==="on",optSelected:s.createElement("select").appendChild(s.createElement("option")).selected,
parentNode:d.removeChild(d.appendChild(s.createElement("div"))).parentNode===null,deleteExpando:true,checkClone:false,scriptEval:false,noCloneEvent:true,boxModel:null};b.type="text/javascript";try{b.appendChild(s.createTextNode("window."+f+"=1;"))}catch(i){}a.insertBefore(b,a.firstChild);if(A[f]){c.support.scriptEval=true;delete A[f]}try{delete b.test}catch(o){c.support.deleteExpando=false}a.removeChild(b);if(d.attachEvent&&d.fireEvent){d.attachEvent("onclick",function k(){c.support.noCloneEvent=
false;d.detachEvent("onclick",k)});d.cloneNode(true).fireEvent("onclick")}d=s.createElement("div");d.innerHTML="<input type='radio' name='radiotest' checked='checked'/>";a=s.createDocumentFragment();a.appendChild(d.firstChild);c.support.checkClone=a.cloneNode(true).cloneNode(true).lastChild.checked;c(function(){var k=s.createElement("div");k.style.width=k.style.paddingLeft="1px";s.body.appendChild(k);c.boxModel=c.support.boxModel=k.offsetWidth===2;s.body.removeChild(k).style.display="none"});a=function(k){var n=
s.createElement("div");k="on"+k;var r=k in n;if(!r){n.setAttribute(k,"return;");r=typeof n[k]==="function"}return r};c.support.submitBubbles=a("submit");c.support.changeBubbles=a("change");a=b=d=e=j=null}})();c.props={"for":"htmlFor","class":"className",readonly:"readOnly",maxlength:"maxLength",cellspacing:"cellSpacing",rowspan:"rowSpan",colspan:"colSpan",tabindex:"tabIndex",usemap:"useMap",frameborder:"frameBorder"};var G="jQuery"+J(),Ya=0,za={};c.extend({cache:{},expando:G,noData:{embed:true,object:true,
applet:true},data:function(a,b,d){if(!(a.nodeName&&c.noData[a.nodeName.toLowerCase()])){a=a==A?za:a;var f=a[G],e=c.cache;if(!f&&typeof b==="string"&&d===w)return null;f||(f=++Ya);if(typeof b==="object"){a[G]=f;e[f]=c.extend(true,{},b)}else if(!e[f]){a[G]=f;e[f]={}}a=e[f];if(d!==w)a[b]=d;return typeof b==="string"?a[b]:a}},removeData:function(a,b){if(!(a.nodeName&&c.noData[a.nodeName.toLowerCase()])){a=a==A?za:a;var d=a[G],f=c.cache,e=f[d];if(b){if(e){delete e[b];c.isEmptyObject(e)&&c.removeData(a)}}else{if(c.support.deleteExpando)delete a[c.expando];
else a.removeAttribute&&a.removeAttribute(c.expando);delete f[d]}}}});c.fn.extend({data:function(a,b){if(typeof a==="undefined"&&this.length)return c.data(this[0]);else if(typeof a==="object")return this.each(function(){c.data(this,a)});var d=a.split(".");d[1]=d[1]?"."+d[1]:"";if(b===w){var f=this.triggerHandler("getData"+d[1]+"!",[d[0]]);if(f===w&&this.length)f=c.data(this[0],a);return f===w&&d[1]?this.data(d[0]):f}else return this.trigger("setData"+d[1]+"!",[d[0],b]).each(function(){c.data(this,
a,b)})},removeData:function(a){return this.each(function(){c.removeData(this,a)})}});c.extend({queue:function(a,b,d){if(a){b=(b||"fx")+"queue";var f=c.data(a,b);if(!d)return f||[];if(!f||c.isArray(d))f=c.data(a,b,c.makeArray(d));else f.push(d);return f}},dequeue:function(a,b){b=b||"fx";var d=c.queue(a,b),f=d.shift();if(f==="inprogress")f=d.shift();if(f){b==="fx"&&d.unshift("inprogress");f.call(a,function(){c.dequeue(a,b)})}}});c.fn.extend({queue:function(a,b){if(typeof a!=="string"){b=a;a="fx"}if(b===
w)return c.queue(this[0],a);return this.each(function(){var d=c.queue(this,a,b);a==="fx"&&d[0]!=="inprogress"&&c.dequeue(this,a)})},dequeue:function(a){return this.each(function(){c.dequeue(this,a)})},delay:function(a,b){a=c.fx?c.fx.speeds[a]||a:a;b=b||"fx";return this.queue(b,function(){var d=this;setTimeout(function(){c.dequeue(d,b)},a)})},clearQueue:function(a){return this.queue(a||"fx",[])}});var Aa=/[\n\t]/g,ca=/\s+/,Za=/\r/g,$a=/href|src|style/,ab=/(button|input)/i,bb=/(button|input|object|select|textarea)/i,
cb=/^(a|area)$/i,Ba=/radio|checkbox/;c.fn.extend({attr:function(a,b){return X(this,a,b,true,c.attr)},removeAttr:function(a){return this.each(function(){c.attr(this,a,"");this.nodeType===1&&this.removeAttribute(a)})},addClass:function(a){if(c.isFunction(a))return this.each(function(n){var r=c(this);r.addClass(a.call(this,n,r.attr("class")))});if(a&&typeof a==="string")for(var b=(a||"").split(ca),d=0,f=this.length;d<f;d++){var e=this[d];if(e.nodeType===1)if(e.className){for(var j=" "+e.className+" ",
i=e.className,o=0,k=b.length;o<k;o++)if(j.indexOf(" "+b[o]+" ")<0)i+=" "+b[o];e.className=c.trim(i)}else e.className=a}return this},removeClass:function(a){if(c.isFunction(a))return this.each(function(k){var n=c(this);n.removeClass(a.call(this,k,n.attr("class")))});if(a&&typeof a==="string"||a===w)for(var b=(a||"").split(ca),d=0,f=this.length;d<f;d++){var e=this[d];if(e.nodeType===1&&e.className)if(a){for(var j=(" "+e.className+" ").replace(Aa," "),i=0,o=b.length;i<o;i++)j=j.replace(" "+b[i]+" ",
" ");e.className=c.trim(j)}else e.className=""}return this},toggleClass:function(a,b){var d=typeof a,f=typeof b==="boolean";if(c.isFunction(a))return this.each(function(e){var j=c(this);j.toggleClass(a.call(this,e,j.attr("class"),b),b)});return this.each(function(){if(d==="string")for(var e,j=0,i=c(this),o=b,k=a.split(ca);e=k[j++];){o=f?o:!i.hasClass(e);i[o?"addClass":"removeClass"](e)}else if(d==="undefined"||d==="boolean"){this.className&&c.data(this,"__className__",this.className);this.className=
this.className||a===false?"":c.data(this,"__className__")||""}})},hasClass:function(a){a=" "+a+" ";for(var b=0,d=this.length;b<d;b++)if((" "+this[b].className+" ").replace(Aa," ").indexOf(a)>-1)return true;return false},val:function(a){if(a===w){var b=this[0];if(b){if(c.nodeName(b,"option"))return(b.attributes.value||{}).specified?b.value:b.text;if(c.nodeName(b,"select")){var d=b.selectedIndex,f=[],e=b.options;b=b.type==="select-one";if(d<0)return null;var j=b?d:0;for(d=b?d+1:e.length;j<d;j++){var i=
e[j];if(i.selected){a=c(i).val();if(b)return a;f.push(a)}}return f}if(Ba.test(b.type)&&!c.support.checkOn)return b.getAttribute("value")===null?"on":b.value;return(b.value||"").replace(Za,"")}return w}var o=c.isFunction(a);return this.each(function(k){var n=c(this),r=a;if(this.nodeType===1){if(o)r=a.call(this,k,n.val());if(typeof r==="number")r+="";if(c.isArray(r)&&Ba.test(this.type))this.checked=c.inArray(n.val(),r)>=0;else if(c.nodeName(this,"select")){var u=c.makeArray(r);c("option",this).each(function(){this.selected=
c.inArray(c(this).val(),u)>=0});if(!u.length)this.selectedIndex=-1}else this.value=r}})}});c.extend({attrFn:{val:true,css:true,html:true,text:true,data:true,width:true,height:true,offset:true},attr:function(a,b,d,f){if(!a||a.nodeType===3||a.nodeType===8)return w;if(f&&b in c.attrFn)return c(a)[b](d);f=a.nodeType!==1||!c.isXMLDoc(a);var e=d!==w;b=f&&c.props[b]||b;if(a.nodeType===1){var j=$a.test(b);if(b in a&&f&&!j){if(e){b==="type"&&ab.test(a.nodeName)&&a.parentNode&&c.error("type property can't be changed");
a[b]=d}if(c.nodeName(a,"form")&&a.getAttributeNode(b))return a.getAttributeNode(b).nodeValue;if(b==="tabIndex")return(b=a.getAttributeNode("tabIndex"))&&b.specified?b.value:bb.test(a.nodeName)||cb.test(a.nodeName)&&a.href?0:w;return a[b]}if(!c.support.style&&f&&b==="style"){if(e)a.style.cssText=""+d;return a.style.cssText}e&&a.setAttribute(b,""+d);a=!c.support.hrefNormalized&&f&&j?a.getAttribute(b,2):a.getAttribute(b);return a===null?w:a}return c.style(a,b,d)}});var O=/\.(.*)$/,db=function(a){return a.replace(/[^\w\s\.\|`]/g,
function(b){return"\\"+b})};c.event={add:function(a,b,d,f){if(!(a.nodeType===3||a.nodeType===8)){if(a.setInterval&&a!==A&&!a.frameElement)a=A;var e,j;if(d.handler){e=d;d=e.handler}if(!d.guid)d.guid=c.guid++;if(j=c.data(a)){var i=j.events=j.events||{},o=j.handle;if(!o)j.handle=o=function(){return typeof c!=="undefined"&&!c.event.triggered?c.event.handle.apply(o.elem,arguments):w};o.elem=a;b=b.split(" ");for(var k,n=0,r;k=b[n++];){j=e?c.extend({},e):{handler:d,data:f};if(k.indexOf(".")>-1){r=k.split(".");
k=r.shift();j.namespace=r.slice(0).sort().join(".")}else{r=[];j.namespace=""}j.type=k;j.guid=d.guid;var u=i[k],z=c.event.special[k]||{};if(!u){u=i[k]=[];if(!z.setup||z.setup.call(a,f,r,o)===false)if(a.addEventListener)a.addEventListener(k,o,false);else a.attachEvent&&a.attachEvent("on"+k,o)}if(z.add){z.add.call(a,j);if(!j.handler.guid)j.handler.guid=d.guid}u.push(j);c.event.global[k]=true}a=null}}},global:{},remove:function(a,b,d,f){if(!(a.nodeType===3||a.nodeType===8)){var e,j=0,i,o,k,n,r,u,z=c.data(a),
C=z&&z.events;if(z&&C){if(b&&b.type){d=b.handler;b=b.type}if(!b||typeof b==="string"&&b.charAt(0)==="."){b=b||"";for(e in C)c.event.remove(a,e+b)}else{for(b=b.split(" ");e=b[j++];){n=e;i=e.indexOf(".")<0;o=[];if(!i){o=e.split(".");e=o.shift();k=new RegExp("(^|\\.)"+c.map(o.slice(0).sort(),db).join("\\.(?:.*\\.)?")+"(\\.|$)")}if(r=C[e])if(d){n=c.event.special[e]||{};for(B=f||0;B<r.length;B++){u=r[B];if(d.guid===u.guid){if(i||k.test(u.namespace)){f==null&&r.splice(B--,1);n.remove&&n.remove.call(a,u)}if(f!=
null)break}}if(r.length===0||f!=null&&r.length===1){if(!n.teardown||n.teardown.call(a,o)===false)Ca(a,e,z.handle);delete C[e]}}else for(var B=0;B<r.length;B++){u=r[B];if(i||k.test(u.namespace)){c.event.remove(a,n,u.handler,B);r.splice(B--,1)}}}if(c.isEmptyObject(C)){if(b=z.handle)b.elem=null;delete z.events;delete z.handle;c.isEmptyObject(z)&&c.removeData(a)}}}}},trigger:function(a,b,d,f){var e=a.type||a;if(!f){a=typeof a==="object"?a[G]?a:c.extend(c.Event(e),a):c.Event(e);if(e.indexOf("!")>=0){a.type=
e=e.slice(0,-1);a.exclusive=true}if(!d){a.stopPropagation();c.event.global[e]&&c.each(c.cache,function(){this.events&&this.events[e]&&c.event.trigger(a,b,this.handle.elem)})}if(!d||d.nodeType===3||d.nodeType===8)return w;a.result=w;a.target=d;b=c.makeArray(b);b.unshift(a)}a.currentTarget=d;(f=c.data(d,"handle"))&&f.apply(d,b);f=d.parentNode||d.ownerDocument;try{if(!(d&&d.nodeName&&c.noData[d.nodeName.toLowerCase()]))if(d["on"+e]&&d["on"+e].apply(d,b)===false)a.result=false}catch(j){}if(!a.isPropagationStopped()&&
f)c.event.trigger(a,b,f,true);else if(!a.isDefaultPrevented()){f=a.target;var i,o=c.nodeName(f,"a")&&e==="click",k=c.event.special[e]||{};if((!k._default||k._default.call(d,a)===false)&&!o&&!(f&&f.nodeName&&c.noData[f.nodeName.toLowerCase()])){try{if(f[e]){if(i=f["on"+e])f["on"+e]=null;c.event.triggered=true;f[e]()}}catch(n){}if(i)f["on"+e]=i;c.event.triggered=false}}},handle:function(a){var b,d,f,e;a=arguments[0]=c.event.fix(a||A.event);a.currentTarget=this;b=a.type.indexOf(".")<0&&!a.exclusive;
if(!b){d=a.type.split(".");a.type=d.shift();f=new RegExp("(^|\\.)"+d.slice(0).sort().join("\\.(?:.*\\.)?")+"(\\.|$)")}e=c.data(this,"events");d=e[a.type];if(e&&d){d=d.slice(0);e=0;for(var j=d.length;e<j;e++){var i=d[e];if(b||f.test(i.namespace)){a.handler=i.handler;a.data=i.data;a.handleObj=i;i=i.handler.apply(this,arguments);if(i!==w){a.result=i;if(i===false){a.preventDefault();a.stopPropagation()}}if(a.isImmediatePropagationStopped())break}}}return a.result},props:"altKey attrChange attrName bubbles button cancelable charCode clientX clientY ctrlKey currentTarget data detail eventPhase fromElement handler keyCode layerX layerY metaKey newValue offsetX offsetY originalTarget pageX pageY prevValue relatedNode relatedTarget screenX screenY shiftKey srcElement target toElement view wheelDelta which".split(" "),
fix:function(a){if(a[G])return a;var b=a;a=c.Event(b);for(var d=this.props.length,f;d;){f=this.props[--d];a[f]=b[f]}if(!a.target)a.target=a.srcElement||s;if(a.target.nodeType===3)a.target=a.target.parentNode;if(!a.relatedTarget&&a.fromElement)a.relatedTarget=a.fromElement===a.target?a.toElement:a.fromElement;if(a.pageX==null&&a.clientX!=null){b=s.documentElement;d=s.body;a.pageX=a.clientX+(b&&b.scrollLeft||d&&d.scrollLeft||0)-(b&&b.clientLeft||d&&d.clientLeft||0);a.pageY=a.clientY+(b&&b.scrollTop||
d&&d.scrollTop||0)-(b&&b.clientTop||d&&d.clientTop||0)}if(!a.which&&(a.charCode||a.charCode===0?a.charCode:a.keyCode))a.which=a.charCode||a.keyCode;if(!a.metaKey&&a.ctrlKey)a.metaKey=a.ctrlKey;if(!a.which&&a.button!==w)a.which=a.button&1?1:a.button&2?3:a.button&4?2:0;return a},guid:1E8,proxy:c.proxy,special:{ready:{setup:c.bindReady,teardown:c.noop},live:{add:function(a){c.event.add(this,a.origType,c.extend({},a,{handler:oa}))},remove:function(a){var b=true,d=a.origType.replace(O,"");c.each(c.data(this,
"events").live||[],function(){if(d===this.origType.replace(O,""))return b=false});b&&c.event.remove(this,a.origType,oa)}},beforeunload:{setup:function(a,b,d){if(this.setInterval)this.onbeforeunload=d;return false},teardown:function(a,b){if(this.onbeforeunload===b)this.onbeforeunload=null}}}};var Ca=s.removeEventListener?function(a,b,d){a.removeEventListener(b,d,false)}:function(a,b,d){a.detachEvent("on"+b,d)};c.Event=function(a){if(!this.preventDefault)return new c.Event(a);if(a&&a.type){this.originalEvent=
a;this.type=a.type}else this.type=a;this.timeStamp=J();this[G]=true};c.Event.prototype={preventDefault:function(){this.isDefaultPrevented=Z;var a=this.originalEvent;if(a){a.preventDefault&&a.preventDefault();a.returnValue=false}},stopPropagation:function(){this.isPropagationStopped=Z;var a=this.originalEvent;if(a){a.stopPropagation&&a.stopPropagation();a.cancelBubble=true}},stopImmediatePropagation:function(){this.isImmediatePropagationStopped=Z;this.stopPropagation()},isDefaultPrevented:Y,isPropagationStopped:Y,
isImmediatePropagationStopped:Y};var Da=function(a){var b=a.relatedTarget;try{for(;b&&b!==this;)b=b.parentNode;if(b!==this){a.type=a.data;c.event.handle.apply(this,arguments)}}catch(d){}},Ea=function(a){a.type=a.data;c.event.handle.apply(this,arguments)};c.each({mouseenter:"mouseover",mouseleave:"mouseout"},function(a,b){c.event.special[a]={setup:function(d){c.event.add(this,b,d&&d.selector?Ea:Da,a)},teardown:function(d){c.event.remove(this,b,d&&d.selector?Ea:Da)}}});if(!c.support.submitBubbles)c.event.special.submit=
{setup:function(){if(this.nodeName.toLowerCase()!=="form"){c.event.add(this,"click.specialSubmit",function(a){var b=a.target,d=b.type;if((d==="submit"||d==="image")&&c(b).closest("form").length)return na("submit",this,arguments)});c.event.add(this,"keypress.specialSubmit",function(a){var b=a.target,d=b.type;if((d==="text"||d==="password")&&c(b).closest("form").length&&a.keyCode===13)return na("submit",this,arguments)})}else return false},teardown:function(){c.event.remove(this,".specialSubmit")}};
if(!c.support.changeBubbles){var da=/textarea|input|select/i,ea,Fa=function(a){var b=a.type,d=a.value;if(b==="radio"||b==="checkbox")d=a.checked;else if(b==="select-multiple")d=a.selectedIndex>-1?c.map(a.options,function(f){return f.selected}).join("-"):"";else if(a.nodeName.toLowerCase()==="select")d=a.selectedIndex;return d},fa=function(a,b){var d=a.target,f,e;if(!(!da.test(d.nodeName)||d.readOnly)){f=c.data(d,"_change_data");e=Fa(d);if(a.type!=="focusout"||d.type!=="radio")c.data(d,"_change_data",
e);if(!(f===w||e===f))if(f!=null||e){a.type="change";return c.event.trigger(a,b,d)}}};c.event.special.change={filters:{focusout:fa,click:function(a){var b=a.target,d=b.type;if(d==="radio"||d==="checkbox"||b.nodeName.toLowerCase()==="select")return fa.call(this,a)},keydown:function(a){var b=a.target,d=b.type;if(a.keyCode===13&&b.nodeName.toLowerCase()!=="textarea"||a.keyCode===32&&(d==="checkbox"||d==="radio")||d==="select-multiple")return fa.call(this,a)},beforeactivate:function(a){a=a.target;c.data(a,
"_change_data",Fa(a))}},setup:function(){if(this.type==="file")return false;for(var a in ea)c.event.add(this,a+".specialChange",ea[a]);return da.test(this.nodeName)},teardown:function(){c.event.remove(this,".specialChange");return da.test(this.nodeName)}};ea=c.event.special.change.filters}s.addEventListener&&c.each({focus:"focusin",blur:"focusout"},function(a,b){function d(f){f=c.event.fix(f);f.type=b;return c.event.handle.call(this,f)}c.event.special[b]={setup:function(){this.addEventListener(a,
d,true)},teardown:function(){this.removeEventListener(a,d,true)}}});c.each(["bind","one"],function(a,b){c.fn[b]=function(d,f,e){if(typeof d==="object"){for(var j in d)this[b](j,f,d[j],e);return this}if(c.isFunction(f)){e=f;f=w}var i=b==="one"?c.proxy(e,function(k){c(this).unbind(k,i);return e.apply(this,arguments)}):e;if(d==="unload"&&b!=="one")this.one(d,f,e);else{j=0;for(var o=this.length;j<o;j++)c.event.add(this[j],d,i,f)}return this}});c.fn.extend({unbind:function(a,b){if(typeof a==="object"&&
!a.preventDefault)for(var d in a)this.unbind(d,a[d]);else{d=0;for(var f=this.length;d<f;d++)c.event.remove(this[d],a,b)}return this},delegate:function(a,b,d,f){return this.live(b,d,f,a)},undelegate:function(a,b,d){return arguments.length===0?this.unbind("live"):this.die(b,null,d,a)},trigger:function(a,b){return this.each(function(){c.event.trigger(a,b,this)})},triggerHandler:function(a,b){if(this[0]){a=c.Event(a);a.preventDefault();a.stopPropagation();c.event.trigger(a,b,this[0]);return a.result}},
toggle:function(a){for(var b=arguments,d=1;d<b.length;)c.proxy(a,b[d++]);return this.click(c.proxy(a,function(f){var e=(c.data(this,"lastToggle"+a.guid)||0)%d;c.data(this,"lastToggle"+a.guid,e+1);f.preventDefault();return b[e].apply(this,arguments)||false}))},hover:function(a,b){return this.mouseenter(a).mouseleave(b||a)}});var Ga={focus:"focusin",blur:"focusout",mouseenter:"mouseover",mouseleave:"mouseout"};c.each(["live","die"],function(a,b){c.fn[b]=function(d,f,e,j){var i,o=0,k,n,r=j||this.selector,
u=j?this:c(this.context);if(c.isFunction(f)){e=f;f=w}for(d=(d||"").split(" ");(i=d[o++])!=null;){j=O.exec(i);k="";if(j){k=j[0];i=i.replace(O,"")}if(i==="hover")d.push("mouseenter"+k,"mouseleave"+k);else{n=i;if(i==="focus"||i==="blur"){d.push(Ga[i]+k);i+=k}else i=(Ga[i]||i)+k;b==="live"?u.each(function(){c.event.add(this,pa(i,r),{data:f,selector:r,handler:e,origType:i,origHandler:e,preType:n})}):u.unbind(pa(i,r),e)}}return this}});c.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error".split(" "),
function(a,b){c.fn[b]=function(d){return d?this.bind(b,d):this.trigger(b)};if(c.attrFn)c.attrFn[b]=true});A.attachEvent&&!A.addEventListener&&A.attachEvent("onunload",function(){for(var a in c.cache)if(c.cache[a].handle)try{c.event.remove(c.cache[a].handle.elem)}catch(b){}});(function(){function a(g){for(var h="",l,m=0;g[m];m++){l=g[m];if(l.nodeType===3||l.nodeType===4)h+=l.nodeValue;else if(l.nodeType!==8)h+=a(l.childNodes)}return h}function b(g,h,l,m,q,p){q=0;for(var v=m.length;q<v;q++){var t=m[q];
if(t){t=t[g];for(var y=false;t;){if(t.sizcache===l){y=m[t.sizset];break}if(t.nodeType===1&&!p){t.sizcache=l;t.sizset=q}if(t.nodeName.toLowerCase()===h){y=t;break}t=t[g]}m[q]=y}}}function d(g,h,l,m,q,p){q=0;for(var v=m.length;q<v;q++){var t=m[q];if(t){t=t[g];for(var y=false;t;){if(t.sizcache===l){y=m[t.sizset];break}if(t.nodeType===1){if(!p){t.sizcache=l;t.sizset=q}if(typeof h!=="string"){if(t===h){y=true;break}}else if(k.filter(h,[t]).length>0){y=t;break}}t=t[g]}m[q]=y}}}var f=/((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^[\]]*\]|['"][^'"]*['"]|[^[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g,
e=0,j=Object.prototype.toString,i=false,o=true;[0,0].sort(function(){o=false;return 0});var k=function(g,h,l,m){l=l||[];var q=h=h||s;if(h.nodeType!==1&&h.nodeType!==9)return[];if(!g||typeof g!=="string")return l;for(var p=[],v,t,y,S,H=true,M=x(h),I=g;(f.exec(""),v=f.exec(I))!==null;){I=v[3];p.push(v[1]);if(v[2]){S=v[3];break}}if(p.length>1&&r.exec(g))if(p.length===2&&n.relative[p[0]])t=ga(p[0]+p[1],h);else for(t=n.relative[p[0]]?[h]:k(p.shift(),h);p.length;){g=p.shift();if(n.relative[g])g+=p.shift();
t=ga(g,t)}else{if(!m&&p.length>1&&h.nodeType===9&&!M&&n.match.ID.test(p[0])&&!n.match.ID.test(p[p.length-1])){v=k.find(p.shift(),h,M);h=v.expr?k.filter(v.expr,v.set)[0]:v.set[0]}if(h){v=m?{expr:p.pop(),set:z(m)}:k.find(p.pop(),p.length===1&&(p[0]==="~"||p[0]==="+")&&h.parentNode?h.parentNode:h,M);t=v.expr?k.filter(v.expr,v.set):v.set;if(p.length>0)y=z(t);else H=false;for(;p.length;){var D=p.pop();v=D;if(n.relative[D])v=p.pop();else D="";if(v==null)v=h;n.relative[D](y,v,M)}}else y=[]}y||(y=t);y||k.error(D||
g);if(j.call(y)==="[object Array]")if(H)if(h&&h.nodeType===1)for(g=0;y[g]!=null;g++){if(y[g]&&(y[g]===true||y[g].nodeType===1&&E(h,y[g])))l.push(t[g])}else for(g=0;y[g]!=null;g++)y[g]&&y[g].nodeType===1&&l.push(t[g]);else l.push.apply(l,y);else z(y,l);if(S){k(S,q,l,m);k.uniqueSort(l)}return l};k.uniqueSort=function(g){if(B){i=o;g.sort(B);if(i)for(var h=1;h<g.length;h++)g[h]===g[h-1]&&g.splice(h--,1)}return g};k.matches=function(g,h){return k(g,null,null,h)};k.find=function(g,h,l){var m,q;if(!g)return[];
for(var p=0,v=n.order.length;p<v;p++){var t=n.order[p];if(q=n.leftMatch[t].exec(g)){var y=q[1];q.splice(1,1);if(y.substr(y.length-1)!=="\\"){q[1]=(q[1]||"").replace(/\\/g,"");m=n.find[t](q,h,l);if(m!=null){g=g.replace(n.match[t],"");break}}}}m||(m=h.getElementsByTagName("*"));return{set:m,expr:g}};k.filter=function(g,h,l,m){for(var q=g,p=[],v=h,t,y,S=h&&h[0]&&x(h[0]);g&&h.length;){for(var H in n.filter)if((t=n.leftMatch[H].exec(g))!=null&&t[2]){var M=n.filter[H],I,D;D=t[1];y=false;t.splice(1,1);if(D.substr(D.length-
1)!=="\\"){if(v===p)p=[];if(n.preFilter[H])if(t=n.preFilter[H](t,v,l,p,m,S)){if(t===true)continue}else y=I=true;if(t)for(var U=0;(D=v[U])!=null;U++)if(D){I=M(D,t,U,v);var Ha=m^!!I;if(l&&I!=null)if(Ha)y=true;else v[U]=false;else if(Ha){p.push(D);y=true}}if(I!==w){l||(v=p);g=g.replace(n.match[H],"");if(!y)return[];break}}}if(g===q)if(y==null)k.error(g);else break;q=g}return v};k.error=function(g){throw"Syntax error, unrecognized expression: "+g;};var n=k.selectors={order:["ID","NAME","TAG"],match:{ID:/#((?:[\w\u00c0-\uFFFF-]|\\.)+)/,
CLASS:/\.((?:[\w\u00c0-\uFFFF-]|\\.)+)/,NAME:/\[name=['"]*((?:[\w\u00c0-\uFFFF-]|\\.)+)['"]*\]/,ATTR:/\[\s*((?:[\w\u00c0-\uFFFF-]|\\.)+)\s*(?:(\S?=)\s*(['"]*)(.*?)\3|)\s*\]/,TAG:/^((?:[\w\u00c0-\uFFFF\*-]|\\.)+)/,CHILD:/:(only|nth|last|first)-child(?:\((even|odd|[\dn+-]*)\))?/,POS:/:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^-]|$)/,PSEUDO:/:((?:[\w\u00c0-\uFFFF-]|\\.)+)(?:\((['"]?)((?:\([^\)]+\)|[^\(\)]*)+)\2\))?/},leftMatch:{},attrMap:{"class":"className","for":"htmlFor"},attrHandle:{href:function(g){return g.getAttribute("href")}},
relative:{"+":function(g,h){var l=typeof h==="string",m=l&&!/\W/.test(h);l=l&&!m;if(m)h=h.toLowerCase();m=0;for(var q=g.length,p;m<q;m++)if(p=g[m]){for(;(p=p.previousSibling)&&p.nodeType!==1;);g[m]=l||p&&p.nodeName.toLowerCase()===h?p||false:p===h}l&&k.filter(h,g,true)},">":function(g,h){var l=typeof h==="string";if(l&&!/\W/.test(h)){h=h.toLowerCase();for(var m=0,q=g.length;m<q;m++){var p=g[m];if(p){l=p.parentNode;g[m]=l.nodeName.toLowerCase()===h?l:false}}}else{m=0;for(q=g.length;m<q;m++)if(p=g[m])g[m]=
l?p.parentNode:p.parentNode===h;l&&k.filter(h,g,true)}},"":function(g,h,l){var m=e++,q=d;if(typeof h==="string"&&!/\W/.test(h)){var p=h=h.toLowerCase();q=b}q("parentNode",h,m,g,p,l)},"~":function(g,h,l){var m=e++,q=d;if(typeof h==="string"&&!/\W/.test(h)){var p=h=h.toLowerCase();q=b}q("previousSibling",h,m,g,p,l)}},find:{ID:function(g,h,l){if(typeof h.getElementById!=="undefined"&&!l)return(g=h.getElementById(g[1]))?[g]:[]},NAME:function(g,h){if(typeof h.getElementsByName!=="undefined"){var l=[];
h=h.getElementsByName(g[1]);for(var m=0,q=h.length;m<q;m++)h[m].getAttribute("name")===g[1]&&l.push(h[m]);return l.length===0?null:l}},TAG:function(g,h){return h.getElementsByTagName(g[1])}},preFilter:{CLASS:function(g,h,l,m,q,p){g=" "+g[1].replace(/\\/g,"")+" ";if(p)return g;p=0;for(var v;(v=h[p])!=null;p++)if(v)if(q^(v.className&&(" "+v.className+" ").replace(/[\t\n]/g," ").indexOf(g)>=0))l||m.push(v);else if(l)h[p]=false;return false},ID:function(g){return g[1].replace(/\\/g,"")},TAG:function(g){return g[1].toLowerCase()},
CHILD:function(g){if(g[1]==="nth"){var h=/(-?)(\d*)n((?:\+|-)?\d*)/.exec(g[2]==="even"&&"2n"||g[2]==="odd"&&"2n+1"||!/\D/.test(g[2])&&"0n+"+g[2]||g[2]);g[2]=h[1]+(h[2]||1)-0;g[3]=h[3]-0}g[0]=e++;return g},ATTR:function(g,h,l,m,q,p){h=g[1].replace(/\\/g,"");if(!p&&n.attrMap[h])g[1]=n.attrMap[h];if(g[2]==="~=")g[4]=" "+g[4]+" ";return g},PSEUDO:function(g,h,l,m,q){if(g[1]==="not")if((f.exec(g[3])||"").length>1||/^\w/.test(g[3]))g[3]=k(g[3],null,null,h);else{g=k.filter(g[3],h,l,true^q);l||m.push.apply(m,
g);return false}else if(n.match.POS.test(g[0])||n.match.CHILD.test(g[0]))return true;return g},POS:function(g){g.unshift(true);return g}},filters:{enabled:function(g){return g.disabled===false&&g.type!=="hidden"},disabled:function(g){return g.disabled===true},checked:function(g){return g.checked===true},selected:function(g){return g.selected===true},parent:function(g){return!!g.firstChild},empty:function(g){return!g.firstChild},has:function(g,h,l){return!!k(l[3],g).length},header:function(g){return/h\d/i.test(g.nodeName)},
text:function(g){return"text"===g.type},radio:function(g){return"radio"===g.type},checkbox:function(g){return"checkbox"===g.type},file:function(g){return"file"===g.type},password:function(g){return"password"===g.type},submit:function(g){return"submit"===g.type},image:function(g){return"image"===g.type},reset:function(g){return"reset"===g.type},button:function(g){return"button"===g.type||g.nodeName.toLowerCase()==="button"},input:function(g){return/input|select|textarea|button/i.test(g.nodeName)}},
setFilters:{first:function(g,h){return h===0},last:function(g,h,l,m){return h===m.length-1},even:function(g,h){return h%2===0},odd:function(g,h){return h%2===1},lt:function(g,h,l){return h<l[3]-0},gt:function(g,h,l){return h>l[3]-0},nth:function(g,h,l){return l[3]-0===h},eq:function(g,h,l){return l[3]-0===h}},filter:{PSEUDO:function(g,h,l,m){var q=h[1],p=n.filters[q];if(p)return p(g,l,h,m);else if(q==="contains")return(g.textContent||g.innerText||a([g])||"").indexOf(h[3])>=0;else if(q==="not"){h=
h[3];l=0;for(m=h.length;l<m;l++)if(h[l]===g)return false;return true}else k.error("Syntax error, unrecognized expression: "+q)},CHILD:function(g,h){var l=h[1],m=g;switch(l){case "only":case "first":for(;m=m.previousSibling;)if(m.nodeType===1)return false;if(l==="first")return true;m=g;case "last":for(;m=m.nextSibling;)if(m.nodeType===1)return false;return true;case "nth":l=h[2];var q=h[3];if(l===1&&q===0)return true;h=h[0];var p=g.parentNode;if(p&&(p.sizcache!==h||!g.nodeIndex)){var v=0;for(m=p.firstChild;m;m=
m.nextSibling)if(m.nodeType===1)m.nodeIndex=++v;p.sizcache=h}g=g.nodeIndex-q;return l===0?g===0:g%l===0&&g/l>=0}},ID:function(g,h){return g.nodeType===1&&g.getAttribute("id")===h},TAG:function(g,h){return h==="*"&&g.nodeType===1||g.nodeName.toLowerCase()===h},CLASS:function(g,h){return(" "+(g.className||g.getAttribute("class"))+" ").indexOf(h)>-1},ATTR:function(g,h){var l=h[1];g=n.attrHandle[l]?n.attrHandle[l](g):g[l]!=null?g[l]:g.getAttribute(l);l=g+"";var m=h[2];h=h[4];return g==null?m==="!=":m===
"="?l===h:m==="*="?l.indexOf(h)>=0:m==="~="?(" "+l+" ").indexOf(h)>=0:!h?l&&g!==false:m==="!="?l!==h:m==="^="?l.indexOf(h)===0:m==="$="?l.substr(l.length-h.length)===h:m==="|="?l===h||l.substr(0,h.length+1)===h+"-":false},POS:function(g,h,l,m){var q=n.setFilters[h[2]];if(q)return q(g,l,h,m)}}},r=n.match.POS;for(var u in n.match){n.match[u]=new RegExp(n.match[u].source+/(?![^\[]*\])(?![^\(]*\))/.source);n.leftMatch[u]=new RegExp(/(^(?:.|\r|\n)*?)/.source+n.match[u].source.replace(/\\(\d+)/g,function(g,
h){return"\\"+(h-0+1)}))}var z=function(g,h){g=Array.prototype.slice.call(g,0);if(h){h.push.apply(h,g);return h}return g};try{Array.prototype.slice.call(s.documentElement.childNodes,0)}catch(C){z=function(g,h){h=h||[];if(j.call(g)==="[object Array]")Array.prototype.push.apply(h,g);else if(typeof g.length==="number")for(var l=0,m=g.length;l<m;l++)h.push(g[l]);else for(l=0;g[l];l++)h.push(g[l]);return h}}var B;if(s.documentElement.compareDocumentPosition)B=function(g,h){if(!g.compareDocumentPosition||
!h.compareDocumentPosition){if(g==h)i=true;return g.compareDocumentPosition?-1:1}g=g.compareDocumentPosition(h)&4?-1:g===h?0:1;if(g===0)i=true;return g};else if("sourceIndex"in s.documentElement)B=function(g,h){if(!g.sourceIndex||!h.sourceIndex){if(g==h)i=true;return g.sourceIndex?-1:1}g=g.sourceIndex-h.sourceIndex;if(g===0)i=true;return g};else if(s.createRange)B=function(g,h){if(!g.ownerDocument||!h.ownerDocument){if(g==h)i=true;return g.ownerDocument?-1:1}var l=g.ownerDocument.createRange(),m=
h.ownerDocument.createRange();l.setStart(g,0);l.setEnd(g,0);m.setStart(h,0);m.setEnd(h,0);g=l.compareBoundaryPoints(Range.START_TO_END,m);if(g===0)i=true;return g};(function(){var g=s.createElement("div"),h="script"+(new Date).getTime();g.innerHTML="<a name='"+h+"'/>";var l=s.documentElement;l.insertBefore(g,l.firstChild);if(s.getElementById(h)){n.find.ID=function(m,q,p){if(typeof q.getElementById!=="undefined"&&!p)return(q=q.getElementById(m[1]))?q.id===m[1]||typeof q.getAttributeNode!=="undefined"&&
q.getAttributeNode("id").nodeValue===m[1]?[q]:w:[]};n.filter.ID=function(m,q){var p=typeof m.getAttributeNode!=="undefined"&&m.getAttributeNode("id");return m.nodeType===1&&p&&p.nodeValue===q}}l.removeChild(g);l=g=null})();(function(){var g=s.createElement("div");g.appendChild(s.createComment(""));if(g.getElementsByTagName("*").length>0)n.find.TAG=function(h,l){l=l.getElementsByTagName(h[1]);if(h[1]==="*"){h=[];for(var m=0;l[m];m++)l[m].nodeType===1&&h.push(l[m]);l=h}return l};g.innerHTML="<a href='#'></a>";
if(g.firstChild&&typeof g.firstChild.getAttribute!=="undefined"&&g.firstChild.getAttribute("href")!=="#")n.attrHandle.href=function(h){return h.getAttribute("href",2)};g=null})();s.querySelectorAll&&function(){var g=k,h=s.createElement("div");h.innerHTML="<p class='TEST'></p>";if(!(h.querySelectorAll&&h.querySelectorAll(".TEST").length===0)){k=function(m,q,p,v){q=q||s;if(!v&&q.nodeType===9&&!x(q))try{return z(q.querySelectorAll(m),p)}catch(t){}return g(m,q,p,v)};for(var l in g)k[l]=g[l];h=null}}();
(function(){var g=s.createElement("div");g.innerHTML="<div class='test e'></div><div class='test'></div>";if(!(!g.getElementsByClassName||g.getElementsByClassName("e").length===0)){g.lastChild.className="e";if(g.getElementsByClassName("e").length!==1){n.order.splice(1,0,"CLASS");n.find.CLASS=function(h,l,m){if(typeof l.getElementsByClassName!=="undefined"&&!m)return l.getElementsByClassName(h[1])};g=null}}})();var E=s.compareDocumentPosition?function(g,h){return!!(g.compareDocumentPosition(h)&16)}:
function(g,h){return g!==h&&(g.contains?g.contains(h):true)},x=function(g){return(g=(g?g.ownerDocument||g:0).documentElement)?g.nodeName!=="HTML":false},ga=function(g,h){var l=[],m="",q;for(h=h.nodeType?[h]:h;q=n.match.PSEUDO.exec(g);){m+=q[0];g=g.replace(n.match.PSEUDO,"")}g=n.relative[g]?g+"*":g;q=0;for(var p=h.length;q<p;q++)k(g,h[q],l);return k.filter(m,l)};c.find=k;c.expr=k.selectors;c.expr[":"]=c.expr.filters;c.unique=k.uniqueSort;c.text=a;c.isXMLDoc=x;c.contains=E})();var eb=/Until$/,fb=/^(?:parents|prevUntil|prevAll)/,
gb=/,/;R=Array.prototype.slice;var Ia=function(a,b,d){if(c.isFunction(b))return c.grep(a,function(e,j){return!!b.call(e,j,e)===d});else if(b.nodeType)return c.grep(a,function(e){return e===b===d});else if(typeof b==="string"){var f=c.grep(a,function(e){return e.nodeType===1});if(Ua.test(b))return c.filter(b,f,!d);else b=c.filter(b,f)}return c.grep(a,function(e){return c.inArray(e,b)>=0===d})};c.fn.extend({find:function(a){for(var b=this.pushStack("","find",a),d=0,f=0,e=this.length;f<e;f++){d=b.length;
c.find(a,this[f],b);if(f>0)for(var j=d;j<b.length;j++)for(var i=0;i<d;i++)if(b[i]===b[j]){b.splice(j--,1);break}}return b},has:function(a){var b=c(a);return this.filter(function(){for(var d=0,f=b.length;d<f;d++)if(c.contains(this,b[d]))return true})},not:function(a){return this.pushStack(Ia(this,a,false),"not",a)},filter:function(a){return this.pushStack(Ia(this,a,true),"filter",a)},is:function(a){return!!a&&c.filter(a,this).length>0},closest:function(a,b){if(c.isArray(a)){var d=[],f=this[0],e,j=
{},i;if(f&&a.length){e=0;for(var o=a.length;e<o;e++){i=a[e];j[i]||(j[i]=c.expr.match.POS.test(i)?c(i,b||this.context):i)}for(;f&&f.ownerDocument&&f!==b;){for(i in j){e=j[i];if(e.jquery?e.index(f)>-1:c(f).is(e)){d.push({selector:i,elem:f});delete j[i]}}f=f.parentNode}}return d}var k=c.expr.match.POS.test(a)?c(a,b||this.context):null;return this.map(function(n,r){for(;r&&r.ownerDocument&&r!==b;){if(k?k.index(r)>-1:c(r).is(a))return r;r=r.parentNode}return null})},index:function(a){if(!a||typeof a===
"string")return c.inArray(this[0],a?c(a):this.parent().children());return c.inArray(a.jquery?a[0]:a,this)},add:function(a,b){a=typeof a==="string"?c(a,b||this.context):c.makeArray(a);b=c.merge(this.get(),a);return this.pushStack(qa(a[0])||qa(b[0])?b:c.unique(b))},andSelf:function(){return this.add(this.prevObject)}});c.each({parent:function(a){return(a=a.parentNode)&&a.nodeType!==11?a:null},parents:function(a){return c.dir(a,"parentNode")},parentsUntil:function(a,b,d){return c.dir(a,"parentNode",
d)},next:function(a){return c.nth(a,2,"nextSibling")},prev:function(a){return c.nth(a,2,"previousSibling")},nextAll:function(a){return c.dir(a,"nextSibling")},prevAll:function(a){return c.dir(a,"previousSibling")},nextUntil:function(a,b,d){return c.dir(a,"nextSibling",d)},prevUntil:function(a,b,d){return c.dir(a,"previousSibling",d)},siblings:function(a){return c.sibling(a.parentNode.firstChild,a)},children:function(a){return c.sibling(a.firstChild)},contents:function(a){return c.nodeName(a,"iframe")?
a.contentDocument||a.contentWindow.document:c.makeArray(a.childNodes)}},function(a,b){c.fn[a]=function(d,f){var e=c.map(this,b,d);eb.test(a)||(f=d);if(f&&typeof f==="string")e=c.filter(f,e);e=this.length>1?c.unique(e):e;if((this.length>1||gb.test(f))&&fb.test(a))e=e.reverse();return this.pushStack(e,a,R.call(arguments).join(","))}});c.extend({filter:function(a,b,d){if(d)a=":not("+a+")";return c.find.matches(a,b)},dir:function(a,b,d){var f=[];for(a=a[b];a&&a.nodeType!==9&&(d===w||a.nodeType!==1||!c(a).is(d));){a.nodeType===
1&&f.push(a);a=a[b]}return f},nth:function(a,b,d){b=b||1;for(var f=0;a;a=a[d])if(a.nodeType===1&&++f===b)break;return a},sibling:function(a,b){for(var d=[];a;a=a.nextSibling)a.nodeType===1&&a!==b&&d.push(a);return d}});var Ja=/ jQuery\d+="(?:\d+|null)"/g,V=/^\s+/,Ka=/(<([\w:]+)[^>]*?)\/>/g,hb=/^(?:area|br|col|embed|hr|img|input|link|meta|param)$/i,La=/<([\w:]+)/,ib=/<tbody/i,jb=/<|&#?\w+;/,ta=/<script|<object|<embed|<option|<style/i,ua=/checked\s*(?:[^=]|=\s*.checked.)/i,Ma=function(a,b,d){return hb.test(d)?
a:b+"></"+d+">"},F={option:[1,"<select multiple='multiple'>","</select>"],legend:[1,"<fieldset>","</fieldset>"],thead:[1,"<table>","</table>"],tr:[2,"<table><tbody>","</tbody></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],col:[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"],area:[1,"<map>","</map>"],_default:[0,"",""]};F.optgroup=F.option;F.tbody=F.tfoot=F.colgroup=F.caption=F.thead;F.th=F.td;if(!c.support.htmlSerialize)F._default=[1,"div<div>","</div>"];c.fn.extend({text:function(a){if(c.isFunction(a))return this.each(function(b){var d=
c(this);d.text(a.call(this,b,d.text()))});if(typeof a!=="object"&&a!==w)return this.empty().append((this[0]&&this[0].ownerDocument||s).createTextNode(a));return c.text(this)},wrapAll:function(a){if(c.isFunction(a))return this.each(function(d){c(this).wrapAll(a.call(this,d))});if(this[0]){var b=c(a,this[0].ownerDocument).eq(0).clone(true);this[0].parentNode&&b.insertBefore(this[0]);b.map(function(){for(var d=this;d.firstChild&&d.firstChild.nodeType===1;)d=d.firstChild;return d}).append(this)}return this},
wrapInner:function(a){if(c.isFunction(a))return this.each(function(b){c(this).wrapInner(a.call(this,b))});return this.each(function(){var b=c(this),d=b.contents();d.length?d.wrapAll(a):b.append(a)})},wrap:function(a){return this.each(function(){c(this).wrapAll(a)})},unwrap:function(){return this.parent().each(function(){c.nodeName(this,"body")||c(this).replaceWith(this.childNodes)}).end()},append:function(){return this.domManip(arguments,true,function(a){this.nodeType===1&&this.appendChild(a)})},
prepend:function(){return this.domManip(arguments,true,function(a){this.nodeType===1&&this.insertBefore(a,this.firstChild)})},before:function(){if(this[0]&&this[0].parentNode)return this.domManip(arguments,false,function(b){this.parentNode.insertBefore(b,this)});else if(arguments.length){var a=c(arguments[0]);a.push.apply(a,this.toArray());return this.pushStack(a,"before",arguments)}},after:function(){if(this[0]&&this[0].parentNode)return this.domManip(arguments,false,function(b){this.parentNode.insertBefore(b,
this.nextSibling)});else if(arguments.length){var a=this.pushStack(this,"after",arguments);a.push.apply(a,c(arguments[0]).toArray());return a}},remove:function(a,b){for(var d=0,f;(f=this[d])!=null;d++)if(!a||c.filter(a,[f]).length){if(!b&&f.nodeType===1){c.cleanData(f.getElementsByTagName("*"));c.cleanData([f])}f.parentNode&&f.parentNode.removeChild(f)}return this},empty:function(){for(var a=0,b;(b=this[a])!=null;a++)for(b.nodeType===1&&c.cleanData(b.getElementsByTagName("*"));b.firstChild;)b.removeChild(b.firstChild);
return this},clone:function(a){var b=this.map(function(){if(!c.support.noCloneEvent&&!c.isXMLDoc(this)){var d=this.outerHTML,f=this.ownerDocument;if(!d){d=f.createElement("div");d.appendChild(this.cloneNode(true));d=d.innerHTML}return c.clean([d.replace(Ja,"").replace(/=([^="'>\s]+\/)>/g,'="$1">').replace(V,"")],f)[0]}else return this.cloneNode(true)});if(a===true){ra(this,b);ra(this.find("*"),b.find("*"))}return b},html:function(a){if(a===w)return this[0]&&this[0].nodeType===1?this[0].innerHTML.replace(Ja,
""):null;else if(typeof a==="string"&&!ta.test(a)&&(c.support.leadingWhitespace||!V.test(a))&&!F[(La.exec(a)||["",""])[1].toLowerCase()]){a=a.replace(Ka,Ma);try{for(var b=0,d=this.length;b<d;b++)if(this[b].nodeType===1){c.cleanData(this[b].getElementsByTagName("*"));this[b].innerHTML=a}}catch(f){this.empty().append(a)}}else c.isFunction(a)?this.each(function(e){var j=c(this),i=j.html();j.empty().append(function(){return a.call(this,e,i)})}):this.empty().append(a);return this},replaceWith:function(a){if(this[0]&&
this[0].parentNode){if(c.isFunction(a))return this.each(function(b){var d=c(this),f=d.html();d.replaceWith(a.call(this,b,f))});if(typeof a!=="string")a=c(a).detach();return this.each(function(){var b=this.nextSibling,d=this.parentNode;c(this).remove();b?c(b).before(a):c(d).append(a)})}else return this.pushStack(c(c.isFunction(a)?a():a),"replaceWith",a)},detach:function(a){return this.remove(a,true)},domManip:function(a,b,d){function f(u){return c.nodeName(u,"table")?u.getElementsByTagName("tbody")[0]||
u.appendChild(u.ownerDocument.createElement("tbody")):u}var e,j,i=a[0],o=[],k;if(!c.support.checkClone&&arguments.length===3&&typeof i==="string"&&ua.test(i))return this.each(function(){c(this).domManip(a,b,d,true)});if(c.isFunction(i))return this.each(function(u){var z=c(this);a[0]=i.call(this,u,b?z.html():w);z.domManip(a,b,d)});if(this[0]){e=i&&i.parentNode;e=c.support.parentNode&&e&&e.nodeType===11&&e.childNodes.length===this.length?{fragment:e}:sa(a,this,o);k=e.fragment;if(j=k.childNodes.length===
1?(k=k.firstChild):k.firstChild){b=b&&c.nodeName(j,"tr");for(var n=0,r=this.length;n<r;n++)d.call(b?f(this[n],j):this[n],n>0||e.cacheable||this.length>1?k.cloneNode(true):k)}o.length&&c.each(o,Qa)}return this}});c.fragments={};c.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(a,b){c.fn[a]=function(d){var f=[];d=c(d);var e=this.length===1&&this[0].parentNode;if(e&&e.nodeType===11&&e.childNodes.length===1&&d.length===1){d[b](this[0]);
return this}else{e=0;for(var j=d.length;e<j;e++){var i=(e>0?this.clone(true):this).get();c.fn[b].apply(c(d[e]),i);f=f.concat(i)}return this.pushStack(f,a,d.selector)}}});c.extend({clean:function(a,b,d,f){b=b||s;if(typeof b.createElement==="undefined")b=b.ownerDocument||b[0]&&b[0].ownerDocument||s;for(var e=[],j=0,i;(i=a[j])!=null;j++){if(typeof i==="number")i+="";if(i){if(typeof i==="string"&&!jb.test(i))i=b.createTextNode(i);else if(typeof i==="string"){i=i.replace(Ka,Ma);var o=(La.exec(i)||["",
""])[1].toLowerCase(),k=F[o]||F._default,n=k[0],r=b.createElement("div");for(r.innerHTML=k[1]+i+k[2];n--;)r=r.lastChild;if(!c.support.tbody){n=ib.test(i);o=o==="table"&&!n?r.firstChild&&r.firstChild.childNodes:k[1]==="<table>"&&!n?r.childNodes:[];for(k=o.length-1;k>=0;--k)c.nodeName(o[k],"tbody")&&!o[k].childNodes.length&&o[k].parentNode.removeChild(o[k])}!c.support.leadingWhitespace&&V.test(i)&&r.insertBefore(b.createTextNode(V.exec(i)[0]),r.firstChild);i=r.childNodes}if(i.nodeType)e.push(i);else e=
c.merge(e,i)}}if(d)for(j=0;e[j];j++)if(f&&c.nodeName(e[j],"script")&&(!e[j].type||e[j].type.toLowerCase()==="text/javascript"))f.push(e[j].parentNode?e[j].parentNode.removeChild(e[j]):e[j]);else{e[j].nodeType===1&&e.splice.apply(e,[j+1,0].concat(c.makeArray(e[j].getElementsByTagName("script"))));d.appendChild(e[j])}return e},cleanData:function(a){for(var b,d,f=c.cache,e=c.event.special,j=c.support.deleteExpando,i=0,o;(o=a[i])!=null;i++)if(d=o[c.expando]){b=f[d];if(b.events)for(var k in b.events)e[k]?
c.event.remove(o,k):Ca(o,k,b.handle);if(j)delete o[c.expando];else o.removeAttribute&&o.removeAttribute(c.expando);delete f[d]}}});var kb=/z-?index|font-?weight|opacity|zoom|line-?height/i,Na=/alpha\([^)]*\)/,Oa=/opacity=([^)]*)/,ha=/float/i,ia=/-([a-z])/ig,lb=/([A-Z])/g,mb=/^-?\d+(?:px)?$/i,nb=/^-?\d/,ob={position:"absolute",visibility:"hidden",display:"block"},pb=["Left","Right"],qb=["Top","Bottom"],rb=s.defaultView&&s.defaultView.getComputedStyle,Pa=c.support.cssFloat?"cssFloat":"styleFloat",ja=
function(a,b){return b.toUpperCase()};c.fn.css=function(a,b){return X(this,a,b,true,function(d,f,e){if(e===w)return c.curCSS(d,f);if(typeof e==="number"&&!kb.test(f))e+="px";c.style(d,f,e)})};c.extend({style:function(a,b,d){if(!a||a.nodeType===3||a.nodeType===8)return w;if((b==="width"||b==="height")&&parseFloat(d)<0)d=w;var f=a.style||a,e=d!==w;if(!c.support.opacity&&b==="opacity"){if(e){f.zoom=1;b=parseInt(d,10)+""==="NaN"?"":"alpha(opacity="+d*100+")";a=f.filter||c.curCSS(a,"filter")||"";f.filter=
Na.test(a)?a.replace(Na,b):b}return f.filter&&f.filter.indexOf("opacity=")>=0?parseFloat(Oa.exec(f.filter)[1])/100+"":""}if(ha.test(b))b=Pa;b=b.replace(ia,ja);if(e)f[b]=d;return f[b]},css:function(a,b,d,f){if(b==="width"||b==="height"){var e,j=b==="width"?pb:qb;function i(){e=b==="width"?a.offsetWidth:a.offsetHeight;f!=="border"&&c.each(j,function(){f||(e-=parseFloat(c.curCSS(a,"padding"+this,true))||0);if(f==="margin")e+=parseFloat(c.curCSS(a,"margin"+this,true))||0;else e-=parseFloat(c.curCSS(a,
"border"+this+"Width",true))||0})}a.offsetWidth!==0?i():c.swap(a,ob,i);return Math.max(0,Math.round(e))}return c.curCSS(a,b,d)},curCSS:function(a,b,d){var f,e=a.style;if(!c.support.opacity&&b==="opacity"&&a.currentStyle){f=Oa.test(a.currentStyle.filter||"")?parseFloat(RegExp.$1)/100+"":"";return f===""?"1":f}if(ha.test(b))b=Pa;if(!d&&e&&e[b])f=e[b];else if(rb){if(ha.test(b))b="float";b=b.replace(lb,"-$1").toLowerCase();e=a.ownerDocument.defaultView;if(!e)return null;if(a=e.getComputedStyle(a,null))f=
a.getPropertyValue(b);if(b==="opacity"&&f==="")f="1"}else if(a.currentStyle){d=b.replace(ia,ja);f=a.currentStyle[b]||a.currentStyle[d];if(!mb.test(f)&&nb.test(f)){b=e.left;var j=a.runtimeStyle.left;a.runtimeStyle.left=a.currentStyle.left;e.left=d==="fontSize"?"1em":f||0;f=e.pixelLeft+"px";e.left=b;a.runtimeStyle.left=j}}return f},swap:function(a,b,d){var f={};for(var e in b){f[e]=a.style[e];a.style[e]=b[e]}d.call(a);for(e in b)a.style[e]=f[e]}});if(c.expr&&c.expr.filters){c.expr.filters.hidden=function(a){var b=
a.offsetWidth,d=a.offsetHeight,f=a.nodeName.toLowerCase()==="tr";return b===0&&d===0&&!f?true:b>0&&d>0&&!f?false:c.curCSS(a,"display")==="none"};c.expr.filters.visible=function(a){return!c.expr.filters.hidden(a)}}var sb=J(),tb=/<script(.|\s)*?\/script>/gi,ub=/select|textarea/i,vb=/color|date|datetime|email|hidden|month|number|password|range|search|tel|text|time|url|week/i,N=/=\?(&|$)/,ka=/\?/,wb=/(\?|&)_=.*?(&|$)/,xb=/^(\w+:)?\/\/([^\/?#]+)/,yb=/%20/g,zb=c.fn.load;c.fn.extend({load:function(a,b,d){if(typeof a!==
"string")return zb.call(this,a);else if(!this.length)return this;var f=a.indexOf(" ");if(f>=0){var e=a.slice(f,a.length);a=a.slice(0,f)}f="GET";if(b)if(c.isFunction(b)){d=b;b=null}else if(typeof b==="object"){b=c.param(b,c.ajaxSettings.traditional);f="POST"}var j=this;c.ajax({url:a,type:f,dataType:"html",data:b,complete:function(i,o){if(o==="success"||o==="notmodified")j.html(e?c("<div />").append(i.responseText.replace(tb,"")).find(e):i.responseText);d&&j.each(d,[i.responseText,o,i])}});return this},
serialize:function(){return c.param(this.serializeArray())},serializeArray:function(){return this.map(function(){return this.elements?c.makeArray(this.elements):this}).filter(function(){return this.name&&!this.disabled&&(this.checked||ub.test(this.nodeName)||vb.test(this.type))}).map(function(a,b){a=c(this).val();return a==null?null:c.isArray(a)?c.map(a,function(d){return{name:b.name,value:d}}):{name:b.name,value:a}}).get()}});c.each("ajaxStart ajaxStop ajaxComplete ajaxError ajaxSuccess ajaxSend".split(" "),
function(a,b){c.fn[b]=function(d){return this.bind(b,d)}});c.extend({get:function(a,b,d,f){if(c.isFunction(b)){f=f||d;d=b;b=null}return c.ajax({type:"GET",url:a,data:b,success:d,dataType:f})},getScript:function(a,b){return c.get(a,null,b,"script")},getJSON:function(a,b,d){return c.get(a,b,d,"json")},post:function(a,b,d,f){if(c.isFunction(b)){f=f||d;d=b;b={}}return c.ajax({type:"POST",url:a,data:b,success:d,dataType:f})},ajaxSetup:function(a){c.extend(c.ajaxSettings,a)},ajaxSettings:{url:location.href,
global:true,type:"GET",contentType:"application/x-www-form-urlencoded",processData:true,async:true,xhr:A.XMLHttpRequest&&(A.location.protocol!=="file:"||!A.ActiveXObject)?function(){return new A.XMLHttpRequest}:function(){try{return new A.ActiveXObject("Microsoft.XMLHTTP")}catch(a){}},accepts:{xml:"application/xml, text/xml",html:"text/html",script:"text/javascript, application/javascript",json:"application/json, text/javascript",text:"text/plain",_default:"*/*"}},lastModified:{},etag:{},ajax:function(a){function b(){e.success&&
e.success.call(k,o,i,x);e.global&&f("ajaxSuccess",[x,e])}function d(){e.complete&&e.complete.call(k,x,i);e.global&&f("ajaxComplete",[x,e]);e.global&&!--c.active&&c.event.trigger("ajaxStop")}function f(q,p){(e.context?c(e.context):c.event).trigger(q,p)}var e=c.extend(true,{},c.ajaxSettings,a),j,i,o,k=a&&a.context||e,n=e.type.toUpperCase();if(e.data&&e.processData&&typeof e.data!=="string")e.data=c.param(e.data,e.traditional);if(e.dataType==="jsonp"){if(n==="GET")N.test(e.url)||(e.url+=(ka.test(e.url)?
"&":"?")+(e.jsonp||"callback")+"=?");else if(!e.data||!N.test(e.data))e.data=(e.data?e.data+"&":"")+(e.jsonp||"callback")+"=?";e.dataType="json"}if(e.dataType==="json"&&(e.data&&N.test(e.data)||N.test(e.url))){j=e.jsonpCallback||"jsonp"+sb++;if(e.data)e.data=(e.data+"").replace(N,"="+j+"$1");e.url=e.url.replace(N,"="+j+"$1");e.dataType="script";A[j]=A[j]||function(q){o=q;b();d();A[j]=w;try{delete A[j]}catch(p){}z&&z.removeChild(C)}}if(e.dataType==="script"&&e.cache===null)e.cache=false;if(e.cache===
false&&n==="GET"){var r=J(),u=e.url.replace(wb,"$1_="+r+"$2");e.url=u+(u===e.url?(ka.test(e.url)?"&":"?")+"_="+r:"")}if(e.data&&n==="GET")e.url+=(ka.test(e.url)?"&":"?")+e.data;e.global&&!c.active++&&c.event.trigger("ajaxStart");r=(r=xb.exec(e.url))&&(r[1]&&r[1]!==location.protocol||r[2]!==location.host);if(e.dataType==="script"&&n==="GET"&&r){var z=s.getElementsByTagName("head")[0]||s.documentElement,C=s.createElement("script");C.src=e.url;if(e.scriptCharset)C.charset=e.scriptCharset;if(!j){var B=
false;C.onload=C.onreadystatechange=function(){if(!B&&(!this.readyState||this.readyState==="loaded"||this.readyState==="complete")){B=true;b();d();C.onload=C.onreadystatechange=null;z&&C.parentNode&&z.removeChild(C)}}}z.insertBefore(C,z.firstChild);return w}var E=false,x=e.xhr();if(x){e.username?x.open(n,e.url,e.async,e.username,e.password):x.open(n,e.url,e.async);try{if(e.data||a&&a.contentType)x.setRequestHeader("Content-Type",e.contentType);if(e.ifModified){c.lastModified[e.url]&&x.setRequestHeader("If-Modified-Since",
c.lastModified[e.url]);c.etag[e.url]&&x.setRequestHeader("If-None-Match",c.etag[e.url])}r||x.setRequestHeader("X-Requested-With","XMLHttpRequest");x.setRequestHeader("Accept",e.dataType&&e.accepts[e.dataType]?e.accepts[e.dataType]+", */*":e.accepts._default)}catch(ga){}if(e.beforeSend&&e.beforeSend.call(k,x,e)===false){e.global&&!--c.active&&c.event.trigger("ajaxStop");x.abort();return false}e.global&&f("ajaxSend",[x,e]);var g=x.onreadystatechange=function(q){if(!x||x.readyState===0||q==="abort"){E||
d();E=true;if(x)x.onreadystatechange=c.noop}else if(!E&&x&&(x.readyState===4||q==="timeout")){E=true;x.onreadystatechange=c.noop;i=q==="timeout"?"timeout":!c.httpSuccess(x)?"error":e.ifModified&&c.httpNotModified(x,e.url)?"notmodified":"success";var p;if(i==="success")try{o=c.httpData(x,e.dataType,e)}catch(v){i="parsererror";p=v}if(i==="success"||i==="notmodified")j||b();else c.handleError(e,x,i,p);d();q==="timeout"&&x.abort();if(e.async)x=null}};try{var h=x.abort;x.abort=function(){x&&h.call(x);
g("abort")}}catch(l){}e.async&&e.timeout>0&&setTimeout(function(){x&&!E&&g("timeout")},e.timeout);try{x.send(n==="POST"||n==="PUT"||n==="DELETE"?e.data:null)}catch(m){c.handleError(e,x,null,m);d()}e.async||g();return x}},handleError:function(a,b,d,f){if(a.error)a.error.call(a.context||a,b,d,f);if(a.global)(a.context?c(a.context):c.event).trigger("ajaxError",[b,a,f])},active:0,httpSuccess:function(a){try{return!a.status&&location.protocol==="file:"||a.status>=200&&a.status<300||a.status===304||a.status===
1223||a.status===0}catch(b){}return false},httpNotModified:function(a,b){var d=a.getResponseHeader("Last-Modified"),f=a.getResponseHeader("Etag");if(d)c.lastModified[b]=d;if(f)c.etag[b]=f;return a.status===304||a.status===0},httpData:function(a,b,d){var f=a.getResponseHeader("content-type")||"",e=b==="xml"||!b&&f.indexOf("xml")>=0;a=e?a.responseXML:a.responseText;e&&a.documentElement.nodeName==="parsererror"&&c.error("parsererror");if(d&&d.dataFilter)a=d.dataFilter(a,b);if(typeof a==="string")if(b===
"json"||!b&&f.indexOf("json")>=0)a=c.parseJSON(a);else if(b==="script"||!b&&f.indexOf("javascript")>=0)c.globalEval(a);return a},param:function(a,b){function d(i,o){if(c.isArray(o))c.each(o,function(k,n){b||/\[\]$/.test(i)?f(i,n):d(i+"["+(typeof n==="object"||c.isArray(n)?k:"")+"]",n)});else!b&&o!=null&&typeof o==="object"?c.each(o,function(k,n){d(i+"["+k+"]",n)}):f(i,o)}function f(i,o){o=c.isFunction(o)?o():o;e[e.length]=encodeURIComponent(i)+"="+encodeURIComponent(o)}var e=[];if(b===w)b=c.ajaxSettings.traditional;
if(c.isArray(a)||a.jquery)c.each(a,function(){f(this.name,this.value)});else for(var j in a)d(j,a[j]);return e.join("&").replace(yb,"+")}});var la={},Ab=/toggle|show|hide/,Bb=/^([+-]=)?([\d+-.]+)(.*)$/,W,va=[["height","marginTop","marginBottom","paddingTop","paddingBottom"],["width","marginLeft","marginRight","paddingLeft","paddingRight"],["opacity"]];c.fn.extend({show:function(a,b){if(a||a===0)return this.animate(K("show",3),a,b);else{a=0;for(b=this.length;a<b;a++){var d=c.data(this[a],"olddisplay");
this[a].style.display=d||"";if(c.css(this[a],"display")==="none"){d=this[a].nodeName;var f;if(la[d])f=la[d];else{var e=c("<"+d+" />").appendTo("body");f=e.css("display");if(f==="none")f="block";e.remove();la[d]=f}c.data(this[a],"olddisplay",f)}}a=0;for(b=this.length;a<b;a++)this[a].style.display=c.data(this[a],"olddisplay")||"";return this}},hide:function(a,b){if(a||a===0)return this.animate(K("hide",3),a,b);else{a=0;for(b=this.length;a<b;a++){var d=c.data(this[a],"olddisplay");!d&&d!=="none"&&c.data(this[a],
"olddisplay",c.css(this[a],"display"))}a=0;for(b=this.length;a<b;a++)this[a].style.display="none";return this}},_toggle:c.fn.toggle,toggle:function(a,b){var d=typeof a==="boolean";if(c.isFunction(a)&&c.isFunction(b))this._toggle.apply(this,arguments);else a==null||d?this.each(function(){var f=d?a:c(this).is(":hidden");c(this)[f?"show":"hide"]()}):this.animate(K("toggle",3),a,b);return this},fadeTo:function(a,b,d){return this.filter(":hidden").css("opacity",0).show().end().animate({opacity:b},a,d)},
animate:function(a,b,d,f){var e=c.speed(b,d,f);if(c.isEmptyObject(a))return this.each(e.complete);return this[e.queue===false?"each":"queue"](function(){var j=c.extend({},e),i,o=this.nodeType===1&&c(this).is(":hidden"),k=this;for(i in a){var n=i.replace(ia,ja);if(i!==n){a[n]=a[i];delete a[i];i=n}if(a[i]==="hide"&&o||a[i]==="show"&&!o)return j.complete.call(this);if((i==="height"||i==="width")&&this.style){j.display=c.css(this,"display");j.overflow=this.style.overflow}if(c.isArray(a[i])){(j.specialEasing=
j.specialEasing||{})[i]=a[i][1];a[i]=a[i][0]}}if(j.overflow!=null)this.style.overflow="hidden";j.curAnim=c.extend({},a);c.each(a,function(r,u){var z=new c.fx(k,j,r);if(Ab.test(u))z[u==="toggle"?o?"show":"hide":u](a);else{var C=Bb.exec(u),B=z.cur(true)||0;if(C){u=parseFloat(C[2]);var E=C[3]||"px";if(E!=="px"){k.style[r]=(u||1)+E;B=(u||1)/z.cur(true)*B;k.style[r]=B+E}if(C[1])u=(C[1]==="-="?-1:1)*u+B;z.custom(B,u,E)}else z.custom(B,u,"")}});return true})},stop:function(a,b){var d=c.timers;a&&this.queue([]);
this.each(function(){for(var f=d.length-1;f>=0;f--)if(d[f].elem===this){b&&d[f](true);d.splice(f,1)}});b||this.dequeue();return this}});c.each({slideDown:K("show",1),slideUp:K("hide",1),slideToggle:K("toggle",1),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"}},function(a,b){c.fn[a]=function(d,f){return this.animate(b,d,f)}});c.extend({speed:function(a,b,d){var f=a&&typeof a==="object"?a:{complete:d||!d&&b||c.isFunction(a)&&a,duration:a,easing:d&&b||b&&!c.isFunction(b)&&b};f.duration=c.fx.off?0:typeof f.duration===
"number"?f.duration:c.fx.speeds[f.duration]||c.fx.speeds._default;f.old=f.complete;f.complete=function(){f.queue!==false&&c(this).dequeue();c.isFunction(f.old)&&f.old.call(this)};return f},easing:{linear:function(a,b,d,f){return d+f*a},swing:function(a,b,d,f){return(-Math.cos(a*Math.PI)/2+0.5)*f+d}},timers:[],fx:function(a,b,d){this.options=b;this.elem=a;this.prop=d;if(!b.orig)b.orig={}}});c.fx.prototype={update:function(){this.options.step&&this.options.step.call(this.elem,this.now,this);(c.fx.step[this.prop]||
c.fx.step._default)(this);if((this.prop==="height"||this.prop==="width")&&this.elem.style)this.elem.style.display="block"},cur:function(a){if(this.elem[this.prop]!=null&&(!this.elem.style||this.elem.style[this.prop]==null))return this.elem[this.prop];return(a=parseFloat(c.css(this.elem,this.prop,a)))&&a>-10000?a:parseFloat(c.curCSS(this.elem,this.prop))||0},custom:function(a,b,d){function f(j){return e.step(j)}this.startTime=J();this.start=a;this.end=b;this.unit=d||this.unit||"px";this.now=this.start;
this.pos=this.state=0;var e=this;f.elem=this.elem;if(f()&&c.timers.push(f)&&!W)W=setInterval(c.fx.tick,13)},show:function(){this.options.orig[this.prop]=c.style(this.elem,this.prop);this.options.show=true;this.custom(this.prop==="width"||this.prop==="height"?1:0,this.cur());c(this.elem).show()},hide:function(){this.options.orig[this.prop]=c.style(this.elem,this.prop);this.options.hide=true;this.custom(this.cur(),0)},step:function(a){var b=J(),d=true;if(a||b>=this.options.duration+this.startTime){this.now=
this.end;this.pos=this.state=1;this.update();this.options.curAnim[this.prop]=true;for(var f in this.options.curAnim)if(this.options.curAnim[f]!==true)d=false;if(d){if(this.options.display!=null){this.elem.style.overflow=this.options.overflow;a=c.data(this.elem,"olddisplay");this.elem.style.display=a?a:this.options.display;if(c.css(this.elem,"display")==="none")this.elem.style.display="block"}this.options.hide&&c(this.elem).hide();if(this.options.hide||this.options.show)for(var e in this.options.curAnim)c.style(this.elem,
e,this.options.orig[e]);this.options.complete.call(this.elem)}return false}else{e=b-this.startTime;this.state=e/this.options.duration;a=this.options.easing||(c.easing.swing?"swing":"linear");this.pos=c.easing[this.options.specialEasing&&this.options.specialEasing[this.prop]||a](this.state,e,0,1,this.options.duration);this.now=this.start+(this.end-this.start)*this.pos;this.update()}return true}};c.extend(c.fx,{tick:function(){for(var a=c.timers,b=0;b<a.length;b++)a[b]()||a.splice(b--,1);a.length||
c.fx.stop()},stop:function(){clearInterval(W);W=null},speeds:{slow:600,fast:200,_default:400},step:{opacity:function(a){c.style(a.elem,"opacity",a.now)},_default:function(a){if(a.elem.style&&a.elem.style[a.prop]!=null)a.elem.style[a.prop]=(a.prop==="width"||a.prop==="height"?Math.max(0,a.now):a.now)+a.unit;else a.elem[a.prop]=a.now}}});if(c.expr&&c.expr.filters)c.expr.filters.animated=function(a){return c.grep(c.timers,function(b){return a===b.elem}).length};c.fn.offset="getBoundingClientRect"in s.documentElement?
function(a){var b=this[0];if(a)return this.each(function(e){c.offset.setOffset(this,a,e)});if(!b||!b.ownerDocument)return null;if(b===b.ownerDocument.body)return c.offset.bodyOffset(b);var d=b.getBoundingClientRect(),f=b.ownerDocument;b=f.body;f=f.documentElement;return{top:d.top+(self.pageYOffset||c.support.boxModel&&f.scrollTop||b.scrollTop)-(f.clientTop||b.clientTop||0),left:d.left+(self.pageXOffset||c.support.boxModel&&f.scrollLeft||b.scrollLeft)-(f.clientLeft||b.clientLeft||0)}}:function(a){var b=
this[0];if(a)return this.each(function(r){c.offset.setOffset(this,a,r)});if(!b||!b.ownerDocument)return null;if(b===b.ownerDocument.body)return c.offset.bodyOffset(b);c.offset.initialize();var d=b.offsetParent,f=b,e=b.ownerDocument,j,i=e.documentElement,o=e.body;f=(e=e.defaultView)?e.getComputedStyle(b,null):b.currentStyle;for(var k=b.offsetTop,n=b.offsetLeft;(b=b.parentNode)&&b!==o&&b!==i;){if(c.offset.supportsFixedPosition&&f.position==="fixed")break;j=e?e.getComputedStyle(b,null):b.currentStyle;
k-=b.scrollTop;n-=b.scrollLeft;if(b===d){k+=b.offsetTop;n+=b.offsetLeft;if(c.offset.doesNotAddBorder&&!(c.offset.doesAddBorderForTableAndCells&&/^t(able|d|h)$/i.test(b.nodeName))){k+=parseFloat(j.borderTopWidth)||0;n+=parseFloat(j.borderLeftWidth)||0}f=d;d=b.offsetParent}if(c.offset.subtractsBorderForOverflowNotVisible&&j.overflow!=="visible"){k+=parseFloat(j.borderTopWidth)||0;n+=parseFloat(j.borderLeftWidth)||0}f=j}if(f.position==="relative"||f.position==="static"){k+=o.offsetTop;n+=o.offsetLeft}if(c.offset.supportsFixedPosition&&
f.position==="fixed"){k+=Math.max(i.scrollTop,o.scrollTop);n+=Math.max(i.scrollLeft,o.scrollLeft)}return{top:k,left:n}};c.offset={initialize:function(){var a=s.body,b=s.createElement("div"),d,f,e,j=parseFloat(c.curCSS(a,"marginTop",true))||0;c.extend(b.style,{position:"absolute",top:0,left:0,margin:0,border:0,width:"1px",height:"1px",visibility:"hidden"});b.innerHTML="<div style='position:absolute;top:0;left:0;margin:0;border:5px solid #000;padding:0;width:1px;height:1px;'><div></div></div><table style='position:absolute;top:0;left:0;margin:0;border:5px solid #000;padding:0;width:1px;height:1px;' cellpadding='0' cellspacing='0'><tr><td></td></tr></table>";
a.insertBefore(b,a.firstChild);d=b.firstChild;f=d.firstChild;e=d.nextSibling.firstChild.firstChild;this.doesNotAddBorder=f.offsetTop!==5;this.doesAddBorderForTableAndCells=e.offsetTop===5;f.style.position="fixed";f.style.top="20px";this.supportsFixedPosition=f.offsetTop===20||f.offsetTop===15;f.style.position=f.style.top="";d.style.overflow="hidden";d.style.position="relative";this.subtractsBorderForOverflowNotVisible=f.offsetTop===-5;this.doesNotIncludeMarginInBodyOffset=a.offsetTop!==j;a.removeChild(b);
c.offset.initialize=c.noop},bodyOffset:function(a){var b=a.offsetTop,d=a.offsetLeft;c.offset.initialize();if(c.offset.doesNotIncludeMarginInBodyOffset){b+=parseFloat(c.curCSS(a,"marginTop",true))||0;d+=parseFloat(c.curCSS(a,"marginLeft",true))||0}return{top:b,left:d}},setOffset:function(a,b,d){if(/static/.test(c.curCSS(a,"position")))a.style.position="relative";var f=c(a),e=f.offset(),j=parseInt(c.curCSS(a,"top",true),10)||0,i=parseInt(c.curCSS(a,"left",true),10)||0;if(c.isFunction(b))b=b.call(a,
d,e);d={top:b.top-e.top+j,left:b.left-e.left+i};"using"in b?b.using.call(a,d):f.css(d)}};c.fn.extend({position:function(){if(!this[0])return null;var a=this[0],b=this.offsetParent(),d=this.offset(),f=/^body|html$/i.test(b[0].nodeName)?{top:0,left:0}:b.offset();d.top-=parseFloat(c.curCSS(a,"marginTop",true))||0;d.left-=parseFloat(c.curCSS(a,"marginLeft",true))||0;f.top+=parseFloat(c.curCSS(b[0],"borderTopWidth",true))||0;f.left+=parseFloat(c.curCSS(b[0],"borderLeftWidth",true))||0;return{top:d.top-
f.top,left:d.left-f.left}},offsetParent:function(){return this.map(function(){for(var a=this.offsetParent||s.body;a&&!/^body|html$/i.test(a.nodeName)&&c.css(a,"position")==="static";)a=a.offsetParent;return a})}});c.each(["Left","Top"],function(a,b){var d="scroll"+b;c.fn[d]=function(f){var e=this[0],j;if(!e)return null;if(f!==w)return this.each(function(){if(j=wa(this))j.scrollTo(!a?f:c(j).scrollLeft(),a?f:c(j).scrollTop());else this[d]=f});else return(j=wa(e))?"pageXOffset"in j?j[a?"pageYOffset":
"pageXOffset"]:c.support.boxModel&&j.document.documentElement[d]||j.document.body[d]:e[d]}});c.each(["Height","Width"],function(a,b){var d=b.toLowerCase();c.fn["inner"+b]=function(){return this[0]?c.css(this[0],d,false,"padding"):null};c.fn["outer"+b]=function(f){return this[0]?c.css(this[0],d,false,f?"margin":"border"):null};c.fn[d]=function(f){var e=this[0];if(!e)return f==null?null:this;if(c.isFunction(f))return this.each(function(j){var i=c(this);i[d](f.call(this,j,i[d]()))});return"scrollTo"in
e&&e.document?e.document.compatMode==="CSS1Compat"&&e.document.documentElement["client"+b]||e.document.body["client"+b]:e.nodeType===9?Math.max(e.documentElement["client"+b],e.body["scroll"+b],e.documentElement["scroll"+b],e.body["offset"+b],e.documentElement["offset"+b]):f===w?c.css(e,d):this.css(d,typeof f==="string"?f:f+"px")}});A.jQuery=A.$=c})(window);

var $DC = $;
// Modernizr v1.7  www.modernizr.com
window.Modernizr=function(a,b,c){function G(){e.input=function(a){for(var b=0,c=a.length;b<c;b++)t[a[b]]=!!(a[b]in l);return t}("autocomplete autofocus list placeholder max min multiple pattern required step".split(" ")),e.inputtypes=function(a){for(var d=0,e,f,h,i=a.length;d<i;d++)l.setAttribute("type",f=a[d]),e=l.type!=="text",e&&(l.value=m,l.style.cssText="position:absolute;visibility:hidden;",/^range$/.test(f)&&l.style.WebkitAppearance!==c?(g.appendChild(l),h=b.defaultView,e=h.getComputedStyle&&h.getComputedStyle(l,null).WebkitAppearance!=="textfield"&&l.offsetHeight!==0,g.removeChild(l)):/^(search|tel)$/.test(f)||(/^(url|email)$/.test(f)?e=l.checkValidity&&l.checkValidity()===!1:/^color$/.test(f)?(g.appendChild(l),g.offsetWidth,e=l.value!=m,g.removeChild(l)):e=l.value!=m)),s[a[d]]=!!e;return s}("search tel url email datetime date month week time datetime-local number range color".split(" "))}function F(a,b){var c=a.charAt(0).toUpperCase()+a.substr(1),d=(a+" "+p.join(c+" ")+c).split(" ");return!!E(d,b)}function E(a,b){for(var d in a)if(k[a[d]]!==c&&(!b||b(a[d],j)))return!0}function D(a,b){return(""+a).indexOf(b)!==-1}function C(a,b){return typeof a===b}function B(a,b){return A(o.join(a+";")+(b||""))}function A(a){k.cssText=a}var d="1.7",e={},f=!0,g=b.documentElement,h=b.head||b.getElementsByTagName("head")[0],i="modernizr",j=b.createElement(i),k=j.style,l=b.createElement("input"),m=":)",n=Object.prototype.toString,o=" -webkit- -moz- -o- -ms- -khtml- ".split(" "),p="Webkit Moz O ms Khtml".split(" "),q={svg:"http://www.w3.org/2000/svg"},r={},s={},t={},u=[],v,w=function(a){var c=b.createElement("style"),d=b.createElement("div"),e;c.textContent=a+"{#modernizr{height:3px}}",h.appendChild(c),d.id="modernizr",g.appendChild(d),e=d.offsetHeight===3,c.parentNode.removeChild(c),d.parentNode.removeChild(d);return!!e},x=function(){function d(d,e){e=e||b.createElement(a[d]||"div");var f=(d="on"+d)in e;f||(e.setAttribute||(e=b.createElement("div")),e.setAttribute&&e.removeAttribute&&(e.setAttribute(d,""),f=C(e[d],"function"),C(e[d],c)||(e[d]=c),e.removeAttribute(d))),e=null;return f}var a={select:"input",change:"input",submit:"form",reset:"form",error:"img",load:"img",abort:"img"};return d}(),y=({}).hasOwnProperty,z;C(y,c)||C(y.call,c)?z=function(a,b){return b in a&&C(a.constructor.prototype[b],c)}:z=function(a,b){return y.call(a,b)},r.flexbox=function(){function c(a,b,c,d){a.style.cssText=o.join(b+":"+c+";")+(d||"")}function a(a,b,c,d){b+=":",a.style.cssText=(b+o.join(c+";"+b)).slice(0,-b.length)+(d||"")}var d=b.createElement("div"),e=b.createElement("div");a(d,"display","box","width:42px;padding:0;"),c(e,"box-flex","1","width:10px;"),d.appendChild(e),g.appendChild(d);var f=e.offsetWidth===42;d.removeChild(e),g.removeChild(d);return f},r.canvas=function(){var a=b.createElement("canvas");return a.getContext&&a.getContext("2d")},r.canvastext=function(){return e.canvas&&C(b.createElement("canvas").getContext("2d").fillText,"function")},r.webgl=function(){return!!a.WebGLRenderingContext},r.touch=function(){return"ontouchstart"in a||w("@media ("+o.join("touch-enabled),(")+"modernizr)")},r.geolocation=function(){return!!navigator.geolocation},r.postmessage=function(){return!!a.postMessage},r.websqldatabase=function(){var b=!!a.openDatabase;return b},r.indexedDB=function(){for(var b=-1,c=p.length;++b<c;){var d=p[b].toLowerCase();if(a[d+"_indexedDB"]||a[d+"IndexedDB"])return!0}return!1},r.hashchange=function(){return x("hashchange",a)&&(b.documentMode===c||b.documentMode>7)},r.history=function(){return !!(a.history&&history.pushState)},r.draganddrop=function(){return x("dragstart")&&x("drop")},r.websockets=function(){return"WebSocket"in a},r.rgba=function(){A("background-color:rgba(150,255,150,.5)");return D(k.backgroundColor,"rgba")},r.hsla=function(){A("background-color:hsla(120,40%,100%,.5)");return D(k.backgroundColor,"rgba")||D(k.backgroundColor,"hsla")},r.multiplebgs=function(){A("background:url(//:),url(//:),red url(//:)");return(new RegExp("(url\\s*\\(.*?){3}")).test(k.background)},r.backgroundsize=function(){return F("backgroundSize")},r.borderimage=function(){return F("borderImage")},r.borderradius=function(){return F("borderRadius","",function(a){return D(a,"orderRadius")})},r.boxshadow=function(){return F("boxShadow")},r.textshadow=function(){return b.createElement("div").style.textShadow===""},r.opacity=function(){B("opacity:.55");return/^0.55$/.test(k.opacity)},r.cssanimations=function(){return F("animationName")},r.csscolumns=function(){return F("columnCount")},r.cssgradients=function(){var a="background-image:",b="gradient(linear,left top,right bottom,from(#9f9),to(white));",c="linear-gradient(left top,#9f9, white);";A((a+o.join(b+a)+o.join(c+a)).slice(0,-a.length));return D(k.backgroundImage,"gradient")},r.cssreflections=function(){return F("boxReflect")},r.csstransforms=function(){return!!E(["transformProperty","WebkitTransform","MozTransform","OTransform","msTransform"])},r.csstransforms3d=function(){var a=!!E(["perspectiveProperty","WebkitPerspective","MozPerspective","OPerspective","msPerspective"]);a&&"webkitPerspective"in g.style&&(a=w("@media ("+o.join("transform-3d),(")+"modernizr)"));return a},r.csstransitions=function(){return F("transitionProperty")},r.fontface=function(){var a,c,d=h||g,e=b.createElement("style"),f=b.implementation||{hasFeature:function(){return!1}};e.type="text/css",d.insertBefore(e,d.firstChild),a=e.sheet||e.styleSheet;var i=f.hasFeature("CSS2","")?function(b){if(!a||!b)return!1;var c=!1;try{a.insertRule(b,0),c=/src/i.test(a.cssRules[0].cssText),a.deleteRule(a.cssRules.length-1)}catch(d){}return c}:function(b){if(!a||!b)return!1;a.cssText=b;return a.cssText.length!==0&&/src/i.test(a.cssText)&&a.cssText.replace(/\r+|\n+/g,"").indexOf(b.split(" ")[0])===0};c=i('@font-face { font-family: "font"; src: url(data:,); }'),d.removeChild(e);return c},r.video=function(){var a=b.createElement("video"),c=!!a.canPlayType;if(c){c=new Boolean(c),c.ogg=a.canPlayType('video/ogg; codecs="theora"');var d='video/mp4; codecs="avc1.42E01E';c.h264=a.canPlayType(d+'"')||a.canPlayType(d+', mp4a.40.2"'),c.webm=a.canPlayType('video/webm; codecs="vp8, vorbis"')}return c},r.audio=function(){var a=b.createElement("audio"),c=!!a.canPlayType;c&&(c=new Boolean(c),c.ogg=a.canPlayType('audio/ogg; codecs="vorbis"'),c.mp3=a.canPlayType("audio/mpeg;"),c.wav=a.canPlayType('audio/wav; codecs="1"'),c.m4a=a.canPlayType("audio/x-m4a;")||a.canPlayType("audio/aac;"));return c},r.localstorage=function(){try{return!!localStorage.getItem}catch(a){return!1}},r.sessionstorage=function(){try{return!!sessionStorage.getItem}catch(a){return!1}},r.webWorkers=function(){return!!a.Worker},r.applicationcache=function(){return!!a.applicationCache},r.svg=function(){return!!b.createElementNS&&!!b.createElementNS(q.svg,"svg").createSVGRect},r.inlinesvg=function(){var a=b.createElement("div");a.innerHTML="<svg/>";return(a.firstChild&&a.firstChild.namespaceURI)==q.svg},r.smil=function(){return!!b.createElementNS&&/SVG/.test(n.call(b.createElementNS(q.svg,"animate")))},r.svgclippaths=function(){return!!b.createElementNS&&/SVG/.test(n.call(b.createElementNS(q.svg,"clipPath")))};for(var H in r)z(r,H)&&(v=H.toLowerCase(),e[v]=r[H](),u.push((e[v]?"":"no-")+v));e.input||G(),e.crosswindowmessaging=e.postmessage,e.historymanagement=e.history,e.addTest=function(a,b){a=a.toLowerCase();if(!e[a]){b=!!b(),g.className+=" "+(b?"":"no-")+a,e[a]=b;return e}},A(""),j=l=null,f&&a.attachEvent&&function(){var a=b.createElement("div");a.innerHTML="<elem></elem>";return a.childNodes.length!==1}()&&function(a,b){function p(a,b){var c=-1,d=a.length,e,f=[];while(++c<d)e=a[c],(b=e.media||b)!="screen"&&f.push(p(e.imports,b),e.cssText);return f.join("")}function o(a){var b=-1;while(++b<e)a.createElement(d[b])}var c="abbr|article|aside|audio|canvas|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",d=c.split("|"),e=d.length,f=new RegExp("(^|\\s)("+c+")","gi"),g=new RegExp("<(/*)("+c+")","gi"),h=new RegExp("(^|[^\\n]*?\\s)("+c+")([^\\n]*)({[\\n\\w\\W]*?})","gi"),i=b.createDocumentFragment(),j=b.documentElement,k=j.firstChild,l=b.createElement("body"),m=b.createElement("style"),n;o(b),o(i),k.insertBefore(m,k.firstChild),m.media="print",a.attachEvent("onbeforeprint",function(){var a=-1,c=p(b.styleSheets,"all"),k=[],o;n=n||b.body;while((o=h.exec(c))!=null)k.push((o[1]+o[2]+o[3]).replace(f,"$1.iepp_$2")+o[4]);m.styleSheet.cssText=k.join("\n");while(++a<e){var q=b.getElementsByTagName(d[a]),r=q.length,s=-1;while(++s<r)q[s].className.indexOf("iepp_")<0&&(q[s].className+=" iepp_"+d[a])}i.appendChild(n),j.appendChild(l),l.className=n.className,l.innerHTML=n.innerHTML.replace(g,"<$1font")}),a.attachEvent("onafterprint",function(){l.innerHTML="",j.removeChild(l),j.appendChild(n),m.styleSheet.cssText=""})}(a,b),e._enableHTML5=f,e._version=d,g.className=g.className.replace(/\bno-js\b/,"")+" js "+u.join(" ");return e}(this,this.document)
eval(function(p,a,c,k,e,r){e=function(c){return(c<a?'':e(parseInt(c/a)))+((c=c%a)>35?String.fromCharCode(c+29):c.toString(36))};if(!''.replace(/^/,String)){while(c--)r[e(c)]=k[c]||e(c);k=[function(e){return r[e]}];e=function(){return'\\w+'};c=1};while(c--)if(k[c])p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c]);return p}('n.5=v(a,b,c){4(7 b!=\'w\'){c=c||{};4(b===o){b=\'\';c.3=-1}2 d=\'\';4(c.3&&(7 c.3==\'p\'||c.3.q)){2 e;4(7 c.3==\'p\'){e=x y();e.z(e.A()+(c.3*B*r*r*C))}s{e=c.3}d=\'; 3=\'+e.q()}2 f=c.8?\'; 8=\'+(c.8):\'\';2 g=c.9?\'; 9=\'+(c.9):\'\';2 h=c.t?\'; t\':\'\';6.5=[a,\'=\',D(b),d,f,g,h].E(\'\')}s{2 j=o;4(6.5&&6.5!=\'\'){2 k=6.5.F(\';\');G(2 i=0;i<k.m;i++){2 l=n.H(k[i]);4(l.u(0,a.m+1)==(a+\'=\')){j=I(l.u(a.m+1));J}}}K j}};',47,47,'||var|expires|if|cookie|document|typeof|path|domain|||||||||||||length|jQuery|null|number|toUTCString|60|else|secure|substring|function|undefined|new|Date|setTime|getTime|24|1000|encodeURIComponent|join|split|for|trim|decodeURIComponent|break|return'.split('|'),0,{}));

/*
 * jQuery Cycle Plugin (with Transition Definitions)
 * Examples and documentation at: http://jquery.malsup.com/cycle/
 * Copyright (c) 2007-2010 M. Alsup
 * Version: 2.88 (08-JUN-2010)
 * Dual licensed under the MIT and GPL licenses.
 * http://jquery.malsup.com/license.html
 * Requires: jQuery v1.2.6 or later
 */
(function($){var ver="2.88";if($.support==undefined){$.support={opacity:!($.browser.msie)};}function debug(s){if($.fn.cycle.debug){log(s);}}function log(){if(window.console&&window.console.log){window.console.log("[cycle] "+Array.prototype.join.call(arguments," "));}}$.fn.cycle=function(options,arg2){var o={s:this.selector,c:this.context};if(this.length===0&&options!="stop"){if(!$.isReady&&o.s){log("DOM not ready, queuing slideshow");$(function(){$(o.s,o.c).cycle(options,arg2);});return this;}log("terminating; zero elements found by selector"+($.isReady?"":" (DOM not ready)"));return this;}return this.each(function(){var opts=handleArguments(this,options,arg2);if(opts===false){return;}opts.updateActivePagerLink=opts.updateActivePagerLink||$.fn.cycle.updateActivePagerLink;if(this.cycleTimeout){clearTimeout(this.cycleTimeout);}this.cycleTimeout=this.cyclePause=0;var $cont=$(this);var $slides=opts.slideExpr?$(opts.slideExpr,this):$cont.children();var els=$slides.get();if(els.length<2){log("terminating; too few slides: "+els.length);return;}var opts2=buildOptions($cont,$slides,els,opts,o);if(opts2===false){return;}var startTime=opts2.continuous?10:getTimeout(els[opts2.currSlide],els[opts2.nextSlide],opts2,!opts2.rev);if(startTime){startTime+=(opts2.delay||0);if(startTime<10){startTime=10;}debug("first timeout: "+startTime);this.cycleTimeout=setTimeout(function(){go(els,opts2,0,(!opts2.rev&&!opts.backwards));},startTime);}});};function handleArguments(cont,options,arg2){if(cont.cycleStop==undefined){cont.cycleStop=0;}if(options===undefined||options===null){options={};}if(options.constructor==String){switch(options){case"destroy":case"stop":var opts=$(cont).data("cycle.opts");if(!opts){return false;}cont.cycleStop++;if(cont.cycleTimeout){clearTimeout(cont.cycleTimeout);}cont.cycleTimeout=0;$(cont).removeData("cycle.opts");if(options=="destroy"){destroy(opts);}return false;case"toggle":cont.cyclePause=(cont.cyclePause===1)?0:1;checkInstantResume(cont.cyclePause,arg2,cont);return false;case"pause":cont.cyclePause=1;return false;case"resume":cont.cyclePause=0;checkInstantResume(false,arg2,cont);return false;case"prev":case"next":var opts=$(cont).data("cycle.opts");if(!opts){log('options not found, "prev/next" ignored');return false;}$.fn.cycle[options](opts);return false;default:options={fx:options};}return options;}else{if(options.constructor==Number){var num=options;options=$(cont).data("cycle.opts");if(!options){log("options not found, can not advance slide");return false;}if(num<0||num>=options.elements.length){log("invalid slide index: "+num);return false;}options.nextSlide=num;if(cont.cycleTimeout){clearTimeout(cont.cycleTimeout);cont.cycleTimeout=0;}if(typeof arg2=="string"){options.oneTimeFx=arg2;}go(options.elements,options,1,num>=options.currSlide);return false;}}return options;function checkInstantResume(isPaused,arg2,cont){if(!isPaused&&arg2===true){var options=$(cont).data("cycle.opts");if(!options){log("options not found, can not resume");return false;}if(cont.cycleTimeout){clearTimeout(cont.cycleTimeout);cont.cycleTimeout=0;}go(options.elements,options,1,(!opts.rev&&!opts.backwards));}}}function removeFilter(el,opts){if(!$.support.opacity&&opts.cleartype&&el.style.filter){try{el.style.removeAttribute("filter");}catch(smother){}}}function destroy(opts){if(opts.next){$(opts.next).unbind(opts.prevNextEvent);}if(opts.prev){$(opts.prev).unbind(opts.prevNextEvent);}if(opts.pager||opts.pagerAnchorBuilder){$.each(opts.pagerAnchors||[],function(){this.unbind().remove();});}opts.pagerAnchors=null;if(opts.destroy){opts.destroy(opts);}}function buildOptions($cont,$slides,els,options,o){var opts=$.extend({},$.fn.cycle.defaults,options||{},$.metadata?$cont.metadata():$.meta?$cont.data():{});if(opts.autostop){opts.countdown=opts.autostopCount||els.length;}var cont=$cont[0];$cont.data("cycle.opts",opts);opts.$cont=$cont;opts.stopCount=cont.cycleStop;opts.elements=els;opts.before=opts.before?[opts.before]:[];opts.after=opts.after?[opts.after]:[];opts.after.unshift(function(){opts.busy=0;});if(!$.support.opacity&&opts.cleartype){opts.after.push(function(){removeFilter(this,opts);});}if(opts.continuous){opts.after.push(function(){go(els,opts,0,(!opts.rev&&!opts.backwards));});}saveOriginalOpts(opts);if(!$.support.opacity&&opts.cleartype&&!opts.cleartypeNoBg){clearTypeFix($slides);}if($cont.css("position")=="static"){$cont.css("position","relative");}if(opts.width){$cont.width(opts.width);}if(opts.height&&opts.height!="auto"){$cont.height(opts.height);}if(opts.startingSlide){opts.startingSlide=parseInt(opts.startingSlide);}else{if(opts.backwards){opts.startingSlide=els.length-1;}}if(opts.random){opts.randomMap=[];for(var i=0;i<els.length;i++){opts.randomMap.push(i);}opts.randomMap.sort(function(a,b){return Math.random()-0.5;});opts.randomIndex=1;opts.startingSlide=opts.randomMap[1];}else{if(opts.startingSlide>=els.length){opts.startingSlide=0;}}opts.currSlide=opts.startingSlide||0;var first=opts.startingSlide;$slides.css({position:"absolute",top:0,left:0}).hide().each(function(i){var z;if(opts.backwards){z=first?i<=first?els.length+(i-first):first-i:els.length-i;}else{z=first?i>=first?els.length-(i-first):first-i:els.length-i;}$(this).css("z-index",z);});$(els[first]).css("opacity",1).show();removeFilter(els[first],opts);if(opts.fit&&opts.width){$slides.width(opts.width);}if(opts.fit&&opts.height&&opts.height!="auto"){$slides.height(opts.height);}var reshape=opts.containerResize&&!$cont.innerHeight();if(reshape){var maxw=0,maxh=0;for(var j=0;j<els.length;j++){var $e=$(els[j]),e=$e[0],w=$e.outerWidth(),h=$e.outerHeight();if(!w){w=e.offsetWidth||e.width||$e.attr("width");}if(!h){h=e.offsetHeight||e.height||$e.attr("height");}maxw=w>maxw?w:maxw;maxh=h>maxh?h:maxh;}if(maxw>0&&maxh>0){$cont.css({width:maxw+"px",height:maxh+"px"});}}if(opts.pause){$cont.hover(function(){this.cyclePause++;},function(){this.cyclePause--;});}if(supportMultiTransitions(opts)===false){return false;}var requeue=false;options.requeueAttempts=options.requeueAttempts||0;$slides.each(function(){var $el=$(this);this.cycleH=(opts.fit&&opts.height)?opts.height:($el.height()||this.offsetHeight||this.height||$el.attr("height")||0);this.cycleW=(opts.fit&&opts.width)?opts.width:($el.width()||this.offsetWidth||this.width||$el.attr("width")||0);if($el.is("img")){var loadingIE=($.browser.msie&&this.cycleW==28&&this.cycleH==30&&!this.complete);var loadingFF=($.browser.mozilla&&this.cycleW==34&&this.cycleH==19&&!this.complete);var loadingOp=($.browser.opera&&((this.cycleW==42&&this.cycleH==19)||(this.cycleW==37&&this.cycleH==17))&&!this.complete);var loadingOther=(this.cycleH==0&&this.cycleW==0&&!this.complete);if(loadingIE||loadingFF||loadingOp||loadingOther){if(o.s&&opts.requeueOnImageNotLoaded&&++options.requeueAttempts<100){log(options.requeueAttempts," - img slide not loaded, requeuing slideshow: ",this.src,this.cycleW,this.cycleH);setTimeout(function(){$(o.s,o.c).cycle(options);},opts.requeueTimeout);requeue=true;return false;}else{log("could not determine size of image: "+this.src,this.cycleW,this.cycleH);}}}return true;});if(requeue){return false;}opts.cssBefore=opts.cssBefore||{};opts.animIn=opts.animIn||{};opts.animOut=opts.animOut||{};$slides.not(":eq("+first+")").css(opts.cssBefore);if(opts.cssFirst){$($slides[first]).css(opts.cssFirst);}if(opts.timeout){opts.timeout=parseInt(opts.timeout);if(opts.speed.constructor==String){opts.speed=$.fx.speeds[opts.speed]||parseInt(opts.speed);}if(!opts.sync){opts.speed=opts.speed/2;}var buffer=opts.fx=="shuffle"?500:250;while((opts.timeout-opts.speed)<buffer){opts.timeout+=opts.speed;}}if(opts.easing){opts.easeIn=opts.easeOut=opts.easing;}if(!opts.speedIn){opts.speedIn=opts.speed;}if(!opts.speedOut){opts.speedOut=opts.speed;}opts.slideCount=els.length;opts.currSlide=opts.lastSlide=first;if(opts.random){if(++opts.randomIndex==els.length){opts.randomIndex=0;}opts.nextSlide=opts.randomMap[opts.randomIndex];}else{if(opts.backwards){opts.nextSlide=opts.startingSlide==0?(els.length-1):opts.startingSlide-1;}else{opts.nextSlide=opts.startingSlide>=(els.length-1)?0:opts.startingSlide+1;}}if(!opts.multiFx){var init=$.fn.cycle.transitions[opts.fx];if($.isFunction(init)){init($cont,$slides,opts);}else{if(opts.fx!="custom"&&!opts.multiFx){log("unknown transition: "+opts.fx,"; slideshow terminating");return false;}}}var e0=$slides[first];if(opts.before.length){opts.before[0].apply(e0,[e0,e0,opts,true]);}if(opts.after.length>1){opts.after[1].apply(e0,[e0,e0,opts,true]);}if(opts.next){$(opts.next).bind(opts.prevNextEvent,function(){return advance(opts,opts.rev?-1:1);});}if(opts.prev){$(opts.prev).bind(opts.prevNextEvent,function(){return advance(opts,opts.rev?1:-1);});}if(opts.pager||opts.pagerAnchorBuilder){buildPager(els,opts);}exposeAddSlide(opts,els);return opts;}function saveOriginalOpts(opts){opts.original={before:[],after:[]};opts.original.cssBefore=$.extend({},opts.cssBefore);opts.original.cssAfter=$.extend({},opts.cssAfter);opts.original.animIn=$.extend({},opts.animIn);opts.original.animOut=$.extend({},opts.animOut);$.each(opts.before,function(){opts.original.before.push(this);});$.each(opts.after,function(){opts.original.after.push(this);});}function supportMultiTransitions(opts){var i,tx,txs=$.fn.cycle.transitions;if(opts.fx.indexOf(",")>0){opts.multiFx=true;opts.fxs=opts.fx.replace(/\s*/g,"").split(",");for(i=0;i<opts.fxs.length;i++){var fx=opts.fxs[i];tx=txs[fx];if(!tx||!txs.hasOwnProperty(fx)||!$.isFunction(tx)){log("discarding unknown transition: ",fx);opts.fxs.splice(i,1);i--;}}if(!opts.fxs.length){log("No valid transitions named; slideshow terminating.");return false;}}else{if(opts.fx=="all"){opts.multiFx=true;opts.fxs=[];for(p in txs){tx=txs[p];if(txs.hasOwnProperty(p)&&$.isFunction(tx)){opts.fxs.push(p);}}}}if(opts.multiFx&&opts.randomizeEffects){var r1=Math.floor(Math.random()*20)+30;for(i=0;i<r1;i++){var r2=Math.floor(Math.random()*opts.fxs.length);opts.fxs.push(opts.fxs.splice(r2,1)[0]);}debug("randomized fx sequence: ",opts.fxs);}return true;}function exposeAddSlide(opts,els){opts.addSlide=function(newSlide,prepend){var $s=$(newSlide),s=$s[0];if(!opts.autostopCount){opts.countdown++;}els[prepend?"unshift":"push"](s);if(opts.els){opts.els[prepend?"unshift":"push"](s);}opts.slideCount=els.length;$s.css("position","absolute");$s[prepend?"prependTo":"appendTo"](opts.$cont);if(prepend){opts.currSlide++;opts.nextSlide++;}if(!$.support.opacity&&opts.cleartype&&!opts.cleartypeNoBg){clearTypeFix($s);}if(opts.fit&&opts.width){$s.width(opts.width);}if(opts.fit&&opts.height&&opts.height!="auto"){$slides.height(opts.height);}s.cycleH=(opts.fit&&opts.height)?opts.height:$s.height();s.cycleW=(opts.fit&&opts.width)?opts.width:$s.width();$s.css(opts.cssBefore);if(opts.pager||opts.pagerAnchorBuilder){$.fn.cycle.createPagerAnchor(els.length-1,s,$(opts.pager),els,opts);}if($.isFunction(opts.onAddSlide)){opts.onAddSlide($s);}else{$s.hide();}};}$.fn.cycle.resetState=function(opts,fx){fx=fx||opts.fx;opts.before=[];opts.after=[];opts.cssBefore=$.extend({},opts.original.cssBefore);opts.cssAfter=$.extend({},opts.original.cssAfter);opts.animIn=$.extend({},opts.original.animIn);opts.animOut=$.extend({},opts.original.animOut);opts.fxFn=null;$.each(opts.original.before,function(){opts.before.push(this);});$.each(opts.original.after,function(){opts.after.push(this);});var init=$.fn.cycle.transitions[fx];if($.isFunction(init)){init(opts.$cont,$(opts.elements),opts);}};function go(els,opts,manual,fwd){if(manual&&opts.busy&&opts.manualTrump){debug("manualTrump in go(), stopping active transition");$(els).stop(true,true);opts.busy=false;}if(opts.busy){debug("transition active, ignoring new tx request");return;}var p=opts.$cont[0],curr=els[opts.currSlide],next=els[opts.nextSlide];if(p.cycleStop!=opts.stopCount||p.cycleTimeout===0&&!manual){return;}if(!manual&&!p.cyclePause&&!opts.bounce&&((opts.autostop&&(--opts.countdown<=0))||(opts.nowrap&&!opts.random&&opts.nextSlide<opts.currSlide))){if(opts.end){opts.end(opts);}return;}var changed=false;if((manual||!p.cyclePause)&&(opts.nextSlide!=opts.currSlide)){changed=true;var fx=opts.fx;curr.cycleH=curr.cycleH||$(curr).height();curr.cycleW=curr.cycleW||$(curr).width();next.cycleH=next.cycleH||$(next).height();next.cycleW=next.cycleW||$(next).width();if(opts.multiFx){if(opts.lastFx==undefined||++opts.lastFx>=opts.fxs.length){opts.lastFx=0;}fx=opts.fxs[opts.lastFx];opts.currFx=fx;}if(opts.oneTimeFx){fx=opts.oneTimeFx;opts.oneTimeFx=null;}$.fn.cycle.resetState(opts,fx);if(opts.before.length){$.each(opts.before,function(i,o){if(p.cycleStop!=opts.stopCount){return;}o.apply(next,[curr,next,opts,fwd]);});}var after=function(){$.each(opts.after,function(i,o){if(p.cycleStop!=opts.stopCount){return;}o.apply(next,[curr,next,opts,fwd]);});};debug("tx firing; currSlide: "+opts.currSlide+"; nextSlide: "+opts.nextSlide);opts.busy=1;if(opts.fxFn){opts.fxFn(curr,next,opts,after,fwd,manual&&opts.fastOnEvent);}else{if($.isFunction($.fn.cycle[opts.fx])){$.fn.cycle[opts.fx](curr,next,opts,after,fwd,manual&&opts.fastOnEvent);}else{$.fn.cycle.custom(curr,next,opts,after,fwd,manual&&opts.fastOnEvent);}}}if(changed||opts.nextSlide==opts.currSlide){opts.lastSlide=opts.currSlide;if(opts.random){opts.currSlide=opts.nextSlide;if(++opts.randomIndex==els.length){opts.randomIndex=0;}opts.nextSlide=opts.randomMap[opts.randomIndex];if(opts.nextSlide==opts.currSlide){opts.nextSlide=(opts.currSlide==opts.slideCount-1)?0:opts.currSlide+1;}}else{if(opts.backwards){var roll=(opts.nextSlide-1)<0;if(roll&&opts.bounce){opts.backwards=!opts.backwards;opts.nextSlide=1;opts.currSlide=0;}else{opts.nextSlide=roll?(els.length-1):opts.nextSlide-1;opts.currSlide=roll?0:opts.nextSlide+1;}}else{var roll=(opts.nextSlide+1)==els.length;if(roll&&opts.bounce){opts.backwards=!opts.backwards;opts.nextSlide=els.length-2;opts.currSlide=els.length-1;}else{opts.nextSlide=roll?0:opts.nextSlide+1;opts.currSlide=roll?els.length-1:opts.nextSlide-1;}}}}if(changed&&opts.pager){opts.updateActivePagerLink(opts.pager,opts.currSlide,opts.activePagerClass);}var ms=0;if(opts.timeout&&!opts.continuous){ms=getTimeout(els[opts.currSlide],els[opts.nextSlide],opts,fwd);}else{if(opts.continuous&&p.cyclePause){ms=10;}}if(ms>0){p.cycleTimeout=setTimeout(function(){go(els,opts,0,(!opts.rev&&!opts.backwards));},ms);}}$.fn.cycle.updateActivePagerLink=function(pager,currSlide,clsName){$(pager).each(function(){$(this).children().removeClass(clsName).eq(currSlide).addClass(clsName);});};function getTimeout(curr,next,opts,fwd){if(opts.timeoutFn){var t=opts.timeoutFn.call(curr,curr,next,opts,fwd);while((t-opts.speed)<250){t+=opts.speed;}debug("calculated timeout: "+t+"; speed: "+opts.speed);if(t!==false){return t;}}return opts.timeout;}$.fn.cycle.next=function(opts){advance(opts,opts.rev?-1:1);};$.fn.cycle.prev=function(opts){advance(opts,opts.rev?1:-1);};function advance(opts,val){var els=opts.elements;var p=opts.$cont[0],timeout=p.cycleTimeout;if(timeout){clearTimeout(timeout);p.cycleTimeout=0;}if(opts.random&&val<0){opts.randomIndex--;if(--opts.randomIndex==-2){opts.randomIndex=els.length-2;}else{if(opts.randomIndex==-1){opts.randomIndex=els.length-1;}}opts.nextSlide=opts.randomMap[opts.randomIndex];}else{if(opts.random){opts.nextSlide=opts.randomMap[opts.randomIndex];}else{opts.nextSlide=opts.currSlide+val;if(opts.nextSlide<0){if(opts.nowrap){return false;}opts.nextSlide=els.length-1;}else{if(opts.nextSlide>=els.length){if(opts.nowrap){return false;}opts.nextSlide=0;}}}}var cb=opts.onPrevNextEvent||opts.prevNextClick;if($.isFunction(cb)){cb(val>0,opts.nextSlide,els[opts.nextSlide]);}go(els,opts,1,val>=0);return false;}function buildPager(els,opts){var $p=$(opts.pager);$.each(els,function(i,o){$.fn.cycle.createPagerAnchor(i,o,$p,els,opts);});opts.updateActivePagerLink(opts.pager,opts.startingSlide,opts.activePagerClass);}$.fn.cycle.createPagerAnchor=function(i,el,$p,els,opts){var a;if($.isFunction(opts.pagerAnchorBuilder)){a=opts.pagerAnchorBuilder(i,el);debug("pagerAnchorBuilder("+i+", el) returned: "+a);}else{a='<a href="#">'+(i+1)+"</a>";}if(!a){return;}var $a=$(a);if($a.parents("body").length===0){var arr=[];if($p.length>1){$p.each(function(){var $clone=$a.clone(true);$(this).append($clone);arr.push($clone[0]);});$a=$(arr);}else{$a.appendTo($p);}}opts.pagerAnchors=opts.pagerAnchors||[];opts.pagerAnchors.push($a);$a.bind(opts.pagerEvent,function(e){e.preventDefault();opts.nextSlide=i;var p=opts.$cont[0],timeout=p.cycleTimeout;if(timeout){clearTimeout(timeout);p.cycleTimeout=0;}var cb=opts.onPagerEvent||opts.pagerClick;if($.isFunction(cb)){cb(opts.nextSlide,els[opts.nextSlide]);}go(els,opts,1,opts.currSlide<i);});if(!/^click/.test(opts.pagerEvent)&&!opts.allowPagerClickBubble){$a.bind("click.cycle",function(){return false;});}if(opts.pauseOnPagerHover){$a.hover(function(){opts.$cont[0].cyclePause++;},function(){opts.$cont[0].cyclePause--;});}};$.fn.cycle.hopsFromLast=function(opts,fwd){var hops,l=opts.lastSlide,c=opts.currSlide;if(fwd){hops=c>l?c-l:opts.slideCount-l;}else{hops=c<l?l-c:l+opts.slideCount-c;}return hops;};function clearTypeFix($slides){debug("applying clearType background-color hack");function hex(s){s=parseInt(s).toString(16);return s.length<2?"0"+s:s;}function getBg(e){for(;e&&e.nodeName.toLowerCase()!="html";e=e.parentNode){var v=$.css(e,"background-color");if(v.indexOf("rgb")>=0){var rgb=v.match(/\d+/g);return"#"+hex(rgb[0])+hex(rgb[1])+hex(rgb[2]);}if(v&&v!="transparent"){return v;}}return"#ffffff";}$slides.each(function(){$(this).css("background-color",getBg(this));});}$.fn.cycle.commonReset=function(curr,next,opts,w,h,rev){$(opts.elements).not(curr).hide();opts.cssBefore.opacity=1;opts.cssBefore.display="block";if(w!==false&&next.cycleW>0){opts.cssBefore.width=next.cycleW;}if(h!==false&&next.cycleH>0){opts.cssBefore.height=next.cycleH;}opts.cssAfter=opts.cssAfter||{};opts.cssAfter.display="none";$(curr).css("zIndex",opts.slideCount+(rev===true?1:0));$(next).css("zIndex",opts.slideCount+(rev===true?0:1));};$.fn.cycle.custom=function(curr,next,opts,cb,fwd,speedOverride){var $l=$(curr),$n=$(next);var speedIn=opts.speedIn,speedOut=opts.speedOut,easeIn=opts.easeIn,easeOut=opts.easeOut;$n.css(opts.cssBefore);if(speedOverride){if(typeof speedOverride=="number"){speedIn=speedOut=speedOverride;}else{speedIn=speedOut=1;}easeIn=easeOut=null;}var fn=function(){$n.animate(opts.animIn,speedIn,easeIn,cb);};$l.animate(opts.animOut,speedOut,easeOut,function(){if(opts.cssAfter){$l.css(opts.cssAfter);}if(!opts.sync){fn();}});if(opts.sync){fn();}};$.fn.cycle.transitions={fade:function($cont,$slides,opts){$slides.not(":eq("+opts.currSlide+")").css("opacity",0);opts.before.push(function(curr,next,opts){$.fn.cycle.commonReset(curr,next,opts);opts.cssBefore.opacity=0;});opts.animIn={opacity:1};opts.animOut={opacity:0};opts.cssBefore={top:0,left:0};}};$.fn.cycle.ver=function(){return ver;};$.fn.cycle.defaults={fx:"fade",timeout:4000,timeoutFn:null,continuous:0,speed:1000,speedIn:null,speedOut:null,next:null,prev:null,onPrevNextEvent:null,prevNextEvent:"click.cycle",pager:null,onPagerEvent:null,pagerEvent:"click.cycle",allowPagerClickBubble:false,pagerAnchorBuilder:null,before:null,after:null,end:null,easing:null,easeIn:null,easeOut:null,shuffle:null,animIn:null,animOut:null,cssBefore:null,cssAfter:null,fxFn:null,height:"auto",startingSlide:0,sync:1,random:0,fit:0,containerResize:1,pause:0,pauseOnPagerHover:0,autostop:0,autostopCount:0,delay:0,slideExpr:null,cleartype:!$.support.opacity,cleartypeNoBg:false,nowrap:0,fastOnEvent:0,randomizeEffects:1,rev:0,manualTrump:true,requeueOnImageNotLoaded:true,requeueTimeout:250,activePagerClass:"activeSlide",updateActivePagerLink:null,backwards:false};})(jQuery);
/*
 * jQuery Cycle Plugin Transition Definitions
 * This script is a plugin for the jQuery Cycle Plugin
 * Examples and documentation at: http://malsup.com/jquery/cycle/
 * Copyright (c) 2007-2010 M. Alsup
 * Version:	 2.72
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 */
(function($){$.fn.cycle.transitions.none=function($cont,$slides,opts){opts.fxFn=function(curr,next,opts,after){$(next).show();$(curr).hide();after();};};$.fn.cycle.transitions.scrollUp=function($cont,$slides,opts){$cont.css("overflow","hidden");opts.before.push($.fn.cycle.commonReset);var h=$cont.height();opts.cssBefore={top:h,left:0};opts.cssFirst={top:0};opts.animIn={top:0};opts.animOut={top:-h};};$.fn.cycle.transitions.scrollDown=function($cont,$slides,opts){$cont.css("overflow","hidden");opts.before.push($.fn.cycle.commonReset);var h=$cont.height();opts.cssFirst={top:0};opts.cssBefore={top:-h,left:0};opts.animIn={top:0};opts.animOut={top:h};};$.fn.cycle.transitions.scrollLeft=function($cont,$slides,opts){$cont.css("overflow","hidden");opts.before.push($.fn.cycle.commonReset);var w=$cont.width();opts.cssFirst={left:0};opts.cssBefore={left:w,top:0};opts.animIn={left:0};opts.animOut={left:0-w};};$.fn.cycle.transitions.scrollRight=function($cont,$slides,opts){$cont.css("overflow","hidden");opts.before.push($.fn.cycle.commonReset);var w=$cont.width();opts.cssFirst={left:0};opts.cssBefore={left:-w,top:0};opts.animIn={left:0};opts.animOut={left:w};};$.fn.cycle.transitions.scrollHorz=function($cont,$slides,opts){$cont.css("overflow","hidden").width();opts.before.push(function(curr,next,opts,fwd){$.fn.cycle.commonReset(curr,next,opts);opts.cssBefore.left=fwd?(next.cycleW-1):(1-next.cycleW);opts.animOut.left=fwd?-curr.cycleW:curr.cycleW;});opts.cssFirst={left:0};opts.cssBefore={top:0};opts.animIn={left:0};opts.animOut={top:0};};$.fn.cycle.transitions.scrollVert=function($cont,$slides,opts){$cont.css("overflow","hidden");opts.before.push(function(curr,next,opts,fwd){$.fn.cycle.commonReset(curr,next,opts);opts.cssBefore.top=fwd?(1-next.cycleH):(next.cycleH-1);opts.animOut.top=fwd?curr.cycleH:-curr.cycleH;});opts.cssFirst={top:0};opts.cssBefore={left:0};opts.animIn={top:0};opts.animOut={left:0};};$.fn.cycle.transitions.slideX=function($cont,$slides,opts){opts.before.push(function(curr,next,opts){$(opts.elements).not(curr).hide();$.fn.cycle.commonReset(curr,next,opts,false,true);opts.animIn.width=next.cycleW;});opts.cssBefore={left:0,top:0,width:0};opts.animIn={width:"show"};opts.animOut={width:0};};$.fn.cycle.transitions.slideY=function($cont,$slides,opts){opts.before.push(function(curr,next,opts){$(opts.elements).not(curr).hide();$.fn.cycle.commonReset(curr,next,opts,true,false);opts.animIn.height=next.cycleH;});opts.cssBefore={left:0,top:0,height:0};opts.animIn={height:"show"};opts.animOut={height:0};};$.fn.cycle.transitions.shuffle=function($cont,$slides,opts){var i,w=$cont.css("overflow","visible").width();$slides.css({left:0,top:0});opts.before.push(function(curr,next,opts){$.fn.cycle.commonReset(curr,next,opts,true,true,true);});if(!opts.speedAdjusted){opts.speed=opts.speed/2;opts.speedAdjusted=true;}opts.random=0;opts.shuffle=opts.shuffle||{left:-w,top:15};opts.els=[];for(i=0;i<$slides.length;i++){opts.els.push($slides[i]);}for(i=0;i<opts.currSlide;i++){opts.els.push(opts.els.shift());}opts.fxFn=function(curr,next,opts,cb,fwd){var $el=fwd?$(curr):$(next);$(next).css(opts.cssBefore);var count=opts.slideCount;$el.animate(opts.shuffle,opts.speedIn,opts.easeIn,function(){var hops=$.fn.cycle.hopsFromLast(opts,fwd);for(var k=0;k<hops;k++){fwd?opts.els.push(opts.els.shift()):opts.els.unshift(opts.els.pop());}if(fwd){for(var i=0,len=opts.els.length;i<len;i++){$(opts.els[i]).css("z-index",len-i+count);}}else{var z=$(curr).css("z-index");$el.css("z-index",parseInt(z)+1+count);}$el.animate({left:0,top:0},opts.speedOut,opts.easeOut,function(){$(fwd?this:curr).hide();if(cb){cb();}});});};opts.cssBefore={display:"block",opacity:1,top:0,left:0};};$.fn.cycle.transitions.turnUp=function($cont,$slides,opts){opts.before.push(function(curr,next,opts){$.fn.cycle.commonReset(curr,next,opts,true,false);opts.cssBefore.top=next.cycleH;opts.animIn.height=next.cycleH;});opts.cssFirst={top:0};opts.cssBefore={left:0,height:0};opts.animIn={top:0};opts.animOut={height:0};};$.fn.cycle.transitions.turnDown=function($cont,$slides,opts){opts.before.push(function(curr,next,opts){$.fn.cycle.commonReset(curr,next,opts,true,false);opts.animIn.height=next.cycleH;opts.animOut.top=curr.cycleH;});opts.cssFirst={top:0};opts.cssBefore={left:0,top:0,height:0};opts.animOut={height:0};};$.fn.cycle.transitions.turnLeft=function($cont,$slides,opts){opts.before.push(function(curr,next,opts){$.fn.cycle.commonReset(curr,next,opts,false,true);opts.cssBefore.left=next.cycleW;opts.animIn.width=next.cycleW;});opts.cssBefore={top:0,width:0};opts.animIn={left:0};opts.animOut={width:0};};$.fn.cycle.transitions.turnRight=function($cont,$slides,opts){opts.before.push(function(curr,next,opts){$.fn.cycle.commonReset(curr,next,opts,false,true);opts.animIn.width=next.cycleW;opts.animOut.left=curr.cycleW;});opts.cssBefore={top:0,left:0,width:0};opts.animIn={left:0};opts.animOut={width:0};};$.fn.cycle.transitions.zoom=function($cont,$slides,opts){opts.before.push(function(curr,next,opts){$.fn.cycle.commonReset(curr,next,opts,false,false,true);opts.cssBefore.top=next.cycleH/2;opts.cssBefore.left=next.cycleW/2;opts.animIn={top:0,left:0,width:next.cycleW,height:next.cycleH};opts.animOut={width:0,height:0,top:curr.cycleH/2,left:curr.cycleW/2};});opts.cssFirst={top:0,left:0};opts.cssBefore={width:0,height:0};};$.fn.cycle.transitions.fadeZoom=function($cont,$slides,opts){opts.before.push(function(curr,next,opts){$.fn.cycle.commonReset(curr,next,opts,false,false);opts.cssBefore.left=next.cycleW/2;opts.cssBefore.top=next.cycleH/2;opts.animIn={top:0,left:0,width:next.cycleW,height:next.cycleH};});opts.cssBefore={width:0,height:0};opts.animOut={opacity:0};};$.fn.cycle.transitions.blindX=function($cont,$slides,opts){var w=$cont.css("overflow","hidden").width();opts.before.push(function(curr,next,opts){$.fn.cycle.commonReset(curr,next,opts);opts.animIn.width=next.cycleW;opts.animOut.left=curr.cycleW;});opts.cssBefore={left:w,top:0};opts.animIn={left:0};opts.animOut={left:w};};$.fn.cycle.transitions.blindY=function($cont,$slides,opts){var h=$cont.css("overflow","hidden").height();opts.before.push(function(curr,next,opts){$.fn.cycle.commonReset(curr,next,opts);opts.animIn.height=next.cycleH;opts.animOut.top=curr.cycleH;});opts.cssBefore={top:h,left:0};opts.animIn={top:0};opts.animOut={top:h};};$.fn.cycle.transitions.blindZ=function($cont,$slides,opts){var h=$cont.css("overflow","hidden").height();var w=$cont.width();opts.before.push(function(curr,next,opts){$.fn.cycle.commonReset(curr,next,opts);opts.animIn.height=next.cycleH;opts.animOut.top=curr.cycleH;});opts.cssBefore={top:h,left:w};opts.animIn={top:0,left:0};opts.animOut={top:h,left:w};};$.fn.cycle.transitions.growX=function($cont,$slides,opts){opts.before.push(function(curr,next,opts){$.fn.cycle.commonReset(curr,next,opts,false,true);opts.cssBefore.left=this.cycleW/2;opts.animIn={left:0,width:this.cycleW};opts.animOut={left:0};});opts.cssBefore={width:0,top:0};};$.fn.cycle.transitions.growY=function($cont,$slides,opts){opts.before.push(function(curr,next,opts){$.fn.cycle.commonReset(curr,next,opts,true,false);opts.cssBefore.top=this.cycleH/2;opts.animIn={top:0,height:this.cycleH};opts.animOut={top:0};});opts.cssBefore={height:0,left:0};};$.fn.cycle.transitions.curtainX=function($cont,$slides,opts){opts.before.push(function(curr,next,opts){$.fn.cycle.commonReset(curr,next,opts,false,true,true);opts.cssBefore.left=next.cycleW/2;opts.animIn={left:0,width:this.cycleW};opts.animOut={left:curr.cycleW/2,width:0};});opts.cssBefore={top:0,width:0};};$.fn.cycle.transitions.curtainY=function($cont,$slides,opts){opts.before.push(function(curr,next,opts){$.fn.cycle.commonReset(curr,next,opts,true,false,true);opts.cssBefore.top=next.cycleH/2;opts.animIn={top:0,height:next.cycleH};opts.animOut={top:curr.cycleH/2,height:0};});opts.cssBefore={left:0,height:0};};$.fn.cycle.transitions.cover=function($cont,$slides,opts){var d=opts.direction||"left";var w=$cont.css("overflow","hidden").width();var h=$cont.height();opts.before.push(function(curr,next,opts){$.fn.cycle.commonReset(curr,next,opts);if(d=="right"){opts.cssBefore.left=-w;}else{if(d=="up"){opts.cssBefore.top=h;}else{if(d=="down"){opts.cssBefore.top=-h;}else{opts.cssBefore.left=w;}}}});opts.animIn={left:0,top:0};opts.animOut={opacity:1};opts.cssBefore={top:0,left:0};};$.fn.cycle.transitions.uncover=function($cont,$slides,opts){var d=opts.direction||"left";var w=$cont.css("overflow","hidden").width();var h=$cont.height();opts.before.push(function(curr,next,opts){$.fn.cycle.commonReset(curr,next,opts,true,true,true);if(d=="right"){opts.animOut.left=w;}else{if(d=="up"){opts.animOut.top=-h;}else{if(d=="down"){opts.animOut.top=h;}else{opts.animOut.left=-w;}}}});opts.animIn={left:0,top:0};opts.animOut={opacity:1};opts.cssBefore={top:0,left:0};};$.fn.cycle.transitions.toss=function($cont,$slides,opts){var w=$cont.css("overflow","visible").width();var h=$cont.height();opts.before.push(function(curr,next,opts){$.fn.cycle.commonReset(curr,next,opts,true,true,true);if(!opts.animOut.left&&!opts.animOut.top){opts.animOut={left:w*2,top:-h/2,opacity:0};}else{opts.animOut.opacity=0;}});opts.cssBefore={left:0,top:0};opts.animIn={left:0};};$.fn.cycle.transitions.wipe=function($cont,$slides,opts){var w=$cont.css("overflow","hidden").width();var h=$cont.height();opts.cssBefore=opts.cssBefore||{};var clip;if(opts.clip){if(/l2r/.test(opts.clip)){clip="rect(0px 0px "+h+"px 0px)";}else{if(/r2l/.test(opts.clip)){clip="rect(0px "+w+"px "+h+"px "+w+"px)";}else{if(/t2b/.test(opts.clip)){clip="rect(0px "+w+"px 0px 0px)";}else{if(/b2t/.test(opts.clip)){clip="rect("+h+"px "+w+"px "+h+"px 0px)";}else{if(/zoom/.test(opts.clip)){var top=parseInt(h/2);var left=parseInt(w/2);clip="rect("+top+"px "+left+"px "+top+"px "+left+"px)";}}}}}}opts.cssBefore.clip=opts.cssBefore.clip||clip||"rect(0px 0px 0px 0px)";var d=opts.cssBefore.clip.match(/(\d+)/g);var t=parseInt(d[0]),r=parseInt(d[1]),b=parseInt(d[2]),l=parseInt(d[3]);opts.before.push(function(curr,next,opts){if(curr==next){return;}var $curr=$(curr),$next=$(next);$.fn.cycle.commonReset(curr,next,opts,true,true,false);opts.cssAfter.display="block";var step=1,count=parseInt((opts.speedIn/13))-1;(function f(){var tt=t?t-parseInt(step*(t/count)):0;var ll=l?l-parseInt(step*(l/count)):0;var bb=b<h?b+parseInt(step*((h-b)/count||1)):h;var rr=r<w?r+parseInt(step*((w-r)/count||1)):w;$next.css({clip:"rect("+tt+"px "+rr+"px "+bb+"px "+ll+"px)"});(step++<=count)?setTimeout(f,13):$curr.css("display","none");})();});opts.cssBefore={display:"block",opacity:1,top:0,left:0};opts.animIn={left:0};opts.animOut={left:0};};})(jQuery);
/*
 * Autocomplete - jQuery plugin 1.0.2
 *
 * Copyright (c) 2007 Dylan Verheul, Dan G. Switzer, Anjesh Tuladhar, Jï¿½rn Zaefferer
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * Revision: $Id: jquery.autocomplete.js 5747 2008-06-25 18:30:55Z joern.zaefferer $
 *
 */

;(function($) {
	
$.fn.extend({
	autocomplete: function(urlOrData, options) {
		var isUrl = typeof urlOrData == "string";
		options = $.extend({}, $.Autocompleter.defaults, {
			url: isUrl ? urlOrData : null,
			data: isUrl ? null : urlOrData,
			delay: isUrl ? $.Autocompleter.defaults.delay : 10,
			max: options && !options.scroll ? 10 : 150
		}, options);
		
		// if highlight is set to false, replace it with a do-nothing function
		options.highlight = options.highlight || function(value) { return value; };
		
		// if the formatMatch option is not specified, then use formatItem for backwards compatibility
		options.formatMatch = options.formatMatch || options.formatItem;
		
		return this.each(function() {
			new $.Autocompleter(this, options);
		});
	},
	result: function(handler) {
		return this.bind("result", handler);
	},
	search: function(handler) {
		return this.trigger("search", [handler]);
	},
	flushCache: function() {
		return this.trigger("flushCache");
	},
	setOptions: function(options){
		return this.trigger("setOptions", [options]);
	},
	unautocomplete: function() {
		return this.trigger("unautocomplete");
	}
});

$.Autocompleter = function(input, options) {

	var KEY = {
		UP: 38,
		DOWN: 40,
		DEL: 46,
		TAB: 9,
		RETURN: 13,
		ESC: 27,
		COMMA: 188,
		PAGEUP: 33,
		PAGEDOWN: 34,
		BACKSPACE: 8
	};

	// Create $ object for input element
	var $input = $(input).attr("autocomplete", "off").addClass(options.inputClass);

	var timeout;
	var previousValue = "";
	var cache = $.Autocompleter.Cache(options);
	var hasFocus = 0;
	var lastKeyPressCode;
	var config = {
		mouseDownOnSelect: false
	};
	var select = $.Autocompleter.Select(options, input, selectCurrent, config);
	
	var blockSubmit;
	
	// prevent form submit in opera when selecting with return key
	$.browser.opera && $(input.form).bind("submit.autocomplete", function() {
		if (blockSubmit) {
			blockSubmit = false;
			return false;
		}
	});
	
	// only opera doesn't trigger keydown multiple times while pressed, others don't work with keypress at all
	$input.bind(($.browser.opera ? "keypress" : "keydown") + ".autocomplete", function(event) {
		// track last key pressed
		lastKeyPressCode = event.keyCode;
		switch(event.keyCode) {
		
			case KEY.UP:
				event.preventDefault();
				if ( select.visible() ) {
					select.prev();
				} else {
					onChange(0, true);
				}
				break;
				
			case KEY.DOWN:
				event.preventDefault();
				if ( select.visible() ) {
					select.next();
				} else {
					onChange(0, true);
				}
				break;
				
			case KEY.PAGEUP:
				event.preventDefault();
				if ( select.visible() ) {
					select.pageUp();
				} else {
					onChange(0, true);
				}
				break;
				
			case KEY.PAGEDOWN:
				event.preventDefault();
				if ( select.visible() ) {
					select.pageDown();
				} else {
					onChange(0, true);
				}
				break;
			
			// matches also semicolon
			case options.multiple && $.trim(options.multipleSeparator) == "," && KEY.COMMA:
			case KEY.TAB:
			case KEY.RETURN:
				if( selectCurrent() ) {
					// stop default to prevent a form submit, Opera needs special handling
					event.preventDefault();
					blockSubmit = true;
					return false;
				}
				break;
				
			case KEY.ESC:
				select.hide();
				break;
				
			default:
				clearTimeout(timeout);
				timeout = setTimeout(onChange, options.delay);
				break;
		}
	}).focus(function(){
		// track whether the field has focus, we shouldn't process any
		// results if the field no longer has focus
		hasFocus++;
	}).blur(function() {
		hasFocus = 0;
		if (!config.mouseDownOnSelect) {
			hideResults();
		}
	}).click(function() {
		// show select when clicking in a focused field
		if ( hasFocus++ > 1 && !select.visible() ) {
			onChange(0, true);
		}
	}).bind("search", function() {
		// TODO why not just specifying both arguments?
		var fn = (arguments.length > 1) ? arguments[1] : null;
		function findValueCallback(q, data) {
			var result;
			if( data && data.length ) {
				for (var i=0; i < data.length; i++) {
					if( data[i].result.toLowerCase() == q.toLowerCase() ) {
						result = data[i];
						break;
					}
				}
			}
			if( typeof fn == "function" ) fn(result);
			else $input.trigger("result", result && [result.data, result.value]);
		}
		$.each(trimWords($input.val()), function(i, value) {
			request(value, findValueCallback, findValueCallback);
		});
	}).bind("flushCache", function() {
		cache.flush();
	}).bind("setOptions", function() {
		$.extend(options, arguments[1]);
		// if we've updated the data, repopulate
		if ( "data" in arguments[1] )
			cache.populate();
	}).bind("unautocomplete", function() {
		select.unbind();
		$input.unbind();
		$(input.form).unbind(".autocomplete");
	});
	
	
	function selectCurrent() {
		var selected = select.selected();
		if( !selected )
			return false;
		
		var v = selected.result;
		previousValue = v;
		
		if ( options.multiple ) {
			var words = trimWords($input.val());
			if ( words.length > 1 ) {
				v = words.slice(0, words.length - 1).join( options.multipleSeparator ) + options.multipleSeparator + v;
			}
			v += options.multipleSeparator;
		}
		
		$input.val(v);
		hideResultsNow();
		$input.trigger("result", [selected.data, selected.value]);
		return true;
	}
	
	function onChange(crap, skipPrevCheck) {
		if( lastKeyPressCode == KEY.DEL ) {
			select.hide();
			return;
		}
		
		var currentValue = $input.val();
		
		if ( !skipPrevCheck && currentValue == previousValue )
			return;
		
		previousValue = currentValue;
		
		currentValue = lastWord(currentValue);
		if ( currentValue.length >= options.minChars) {
			$input.addClass(options.loadingClass);
			if (!options.matchCase)
				currentValue = currentValue.toLowerCase();
			request(currentValue, receiveData, hideResultsNow);
		} else {
			stopLoading();
			select.hide();
		}
	};
	
	function trimWords(value) {
		if ( !value ) {
			return [""];
		}
		var words = value.split( options.multipleSeparator );
		var result = [];
		$.each(words, function(i, value) {
			if ( $.trim(value) )
				result[i] = $.trim(value);
		});
		return result;
	}
	
	function lastWord(value) {
		if ( !options.multiple )
			return value;
		var words = trimWords(value);
		return words[words.length - 1];
	}
	
	// fills in the input box w/the first match (assumed to be the best match)
	// q: the term entered
	// sValue: the first matching result
	function autoFill(q, sValue){
		// autofill in the complete box w/the first match as long as the user hasn't entered in more data
		// if the last user key pressed was backspace, don't autofill
		if( options.autoFill && (lastWord($input.val()).toLowerCase() == q.toLowerCase()) && lastKeyPressCode != KEY.BACKSPACE ) {
			// fill in the value (keep the case the user has typed)
			$input.val($input.val() + sValue.substring(lastWord(previousValue).length));
			// select the portion of the value not typed by the user (so the next character will erase)
			$.Autocompleter.Selection(input, previousValue.length, previousValue.length + sValue.length);
		}
	};

	function hideResults() {
		clearTimeout(timeout);
		timeout = setTimeout(hideResultsNow, 200);
	};

	function hideResultsNow() {
		var wasVisible = select.visible();
		select.hide();
		clearTimeout(timeout);
		stopLoading();
		if (options.mustMatch) {
			// call search and run callback
			$input.search(
				function (result){
					// if no value found, clear the input box
					if( !result ) {
						if (options.multiple) {
							var words = trimWords($input.val()).slice(0, -1);
							$input.val( words.join(options.multipleSeparator) + (words.length ? options.multipleSeparator : "") );
						}
						else
							$input.val( "" );
					}
				}
			);
		}
		if (wasVisible)
			// position cursor at end of input field
			$.Autocompleter.Selection(input, input.value.length, input.value.length);
	};

	function receiveData(q, data) {
		if ( data && data.length && hasFocus ) {
			stopLoading();
			select.display(data, q);
			autoFill(q, data[0].value);
			select.show();
		} else {
			hideResultsNow();
		}
	};

	function request(term, success, failure) {
		if (!options.matchCase)
			term = term.toLowerCase();
		var data = cache.load(term);
		// recieve the cached data
		if (data && data.length) {
			success(term, data);
		// if an AJAX url has been supplied, try loading the data now
		} else if( (typeof options.url == "string") && (options.url.length > 0) ){
			
			var extraParams = {
				timestamp: +new Date()
			};
			$.each(options.extraParams, function(key, param) {
				extraParams[key] = typeof param == "function" ? param() : param;
			});
			
			$.ajax({
				// try to leverage ajaxQueue plugin to abort previous requests
				mode: "abort",
				// limit abortion to this input
				port: "autocomplete" + input.name,
				dataType: options.dataType,
				url: options.url,
				data: $.extend({
					q: lastWord(term),
					limit: options.max
				}, extraParams),
				success: function(data) {
					var parsed = options.parse && options.parse(data) || parse(data);
					cache.add(term, parsed);
					success(term, parsed);
				}
			});
		} else {
			// if we have a failure, we need to empty the list -- this prevents the the [TAB] key from selecting the last successful match
			select.emptyList();
			failure(term);
		}
	};
	
	function parse(data) {
		var parsed = [];
		var rows = data.split("\n");
		for (var i=0; i < rows.length; i++) {
			var row = $.trim(rows[i]);
			if (row) {
				row = row.split("|");
				parsed[parsed.length] = {
					data: row,
					value: row[0],
					result: options.formatResult && options.formatResult(row, row[0]) || row[0]
				};
			}
		}
		return parsed;
	};

	function stopLoading() {
		$input.removeClass(options.loadingClass);
	};

};

$.Autocompleter.defaults = {
	inputClass: "ac_input",
	resultsClass: "ac_results",
	loadingClass: "ac_loading",
	minChars: 1,
	delay: 400,
	matchCase: false,
	matchSubset: true,
	matchContains: false,
	cacheLength: 10,
	max: 100,
	mustMatch: false,
	extraParams: {},
	selectFirst: true,
	formatItem: function(row) { return row[0]; },
	formatMatch: null,
	autoFill: false,
	width: 0,
	multiple: false,
	multipleSeparator: ", ",
	highlight: function(value, term) {
		return value.replace(new RegExp("(?![^&;]+;)(?!<[^<>]*)(" + term.replace(/([\^\$\(\)\[\]\{\}\*\.\+\?\|\\])/gi, "\\$1") + ")(?![^<>]*>)(?![^&;]+;)", "gi"), "<strong>$1</strong>");
	},
    scroll: true,
    scrollHeight: 180
};

$.Autocompleter.Cache = function(options) {

	var data = {};
	var length = 0;
	
	function matchSubset(s, sub) {
		if (!options.matchCase) 
			s = s.toLowerCase();
		var i = s.indexOf(sub);
		if (i == -1) return false;
		return i == 0 || options.matchContains;
	};
	
	function add(q, value) {
		if (length > options.cacheLength){
			flush();
		}
		if (!data[q]){ 
			length++;
		}
		data[q] = value;
	}
	
	function populate(){
		if( !options.data ) return false;
		// track the matches
		var stMatchSets = {},
			nullData = 0;

		// no url was specified, we need to adjust the cache length to make sure it fits the local data store
		if( !options.url ) options.cacheLength = 1;
		
		// track all options for minChars = 0
		stMatchSets[""] = [];
		
		// loop through the array and create a lookup structure
		for ( var i = 0, ol = options.data.length; i < ol; i++ ) {
			var rawValue = options.data[i];
			// if rawValue is a string, make an array otherwise just reference the array
			rawValue = (typeof rawValue == "string") ? [rawValue] : rawValue;
			
			var value = options.formatMatch(rawValue, i+1, options.data.length);
			if ( value === false )
				continue;
				
			var firstChar = value.charAt(0).toLowerCase();
			// if no lookup array for this character exists, look it up now
			if( !stMatchSets[firstChar] ) 
				stMatchSets[firstChar] = [];

			// if the match is a string
			var row = {
				value: value,
				data: rawValue,
				result: options.formatResult && options.formatResult(rawValue) || value
			};
			
			// push the current match into the set list
			stMatchSets[firstChar].push(row);

			// keep track of minChars zero items
			if ( nullData++ < options.max ) {
				stMatchSets[""].push(row);
			}
		};

		// add the data items to the cache
		$.each(stMatchSets, function(i, value) {
			// increase the cache size
			options.cacheLength++;
			// add to the cache
			add(i, value);
		});
	}
	
	// populate any existing data
	setTimeout(populate, 25);
	
	function flush(){
		data = {};
		length = 0;
	}
	
	return {
		flush: flush,
		add: add,
		populate: populate,
		load: function(q) {
			if (!options.cacheLength || !length)
				return null;
			/* 
			 * if dealing w/local data and matchContains than we must make sure
			 * to loop through all the data collections looking for matches
			 */
			if( !options.url && options.matchContains ){
				// track all matches
				var csub = [];
				// loop through all the data grids for matches
				for( var k in data ){
					// don't search through the stMatchSets[""] (minChars: 0) cache
					// this prevents duplicates
					if( k.length > 0 ){
						var c = data[k];
						$.each(c, function(i, x) {
							// if we've got a match, add it to the array
							if (matchSubset(x.value, q)) {
								csub.push(x);
							}
						});
					}
				}				
				return csub;
			} else 
			// if the exact item exists, use it
			if (data[q]){
				return data[q];
			} else
			if (options.matchSubset) {
				for (var i = q.length - 1; i >= options.minChars; i--) {
					var c = data[q.substr(0, i)];
					if (c) {
						var csub = [];
						$.each(c, function(i, x) {
							if (matchSubset(x.value, q)) {
								csub[csub.length] = x;
							}
						});
						return csub;
					}
				}
			}
			return null;
		}
	};
};

$.Autocompleter.Select = function (options, input, select, config) {
	var CLASSES = {
		ACTIVE: "ac_over"
	};
	
	var listItems,
		active = -1,
		data,
		term = "",
		needsInit = true,
		element,
		list;
	
	// Create results
	function init() {
		if (!needsInit)
			return;
		element = $("<div/>")
		.hide()
		.addClass(options.resultsClass)
		.css("position", "absolute")
		.appendTo(document.body);
	
		list = $("<ul/>").appendTo(element).mouseover( function(event) {
			if(target(event).nodeName && target(event).nodeName.toUpperCase() == 'LI') {
	            active = $("li", list).removeClass(CLASSES.ACTIVE).index(target(event));
			    $(target(event)).addClass(CLASSES.ACTIVE);            
	        }
		}).click(function(event) {
			$(target(event)).addClass(CLASSES.ACTIVE);
			select();
			// TODO provide option to avoid setting focus again after selection? useful for cleanup-on-focus
			input.focus();
			return false;
		}).mousedown(function() {
			config.mouseDownOnSelect = true;
		}).mouseup(function() {
			config.mouseDownOnSelect = false;
		});
		
		if( options.width > 0 )
			element.css("width", options.width);
			
		needsInit = false;
	} 
	
	function target(event) {
		var element = event.target;
		while(element && element.tagName != "LI")
			element = element.parentNode;
		// more fun with IE, sometimes event.target is empty, just ignore it then
		if(!element)
			return [];
		return element;
	}

	function moveSelect(step) {
		listItems.slice(active, active + 1).removeClass(CLASSES.ACTIVE);
		movePosition(step);
        var activeItem = listItems.slice(active, active + 1).addClass(CLASSES.ACTIVE);
        if(options.scroll) {
            var offset = 0;
            listItems.slice(0, active).each(function() {
				offset += this.offsetHeight;
			});
            if((offset + activeItem[0].offsetHeight - list.scrollTop()) > list[0].clientHeight) {
                list.scrollTop(offset + activeItem[0].offsetHeight - list.innerHeight());
            } else if(offset < list.scrollTop()) {
                list.scrollTop(offset);
            }
        }
	};
	
	function movePosition(step) {
		active += step;
		if (active < 0) {
			active = listItems.size() - 1;
		} else if (active >= listItems.size()) {
			active = 0;
		}
	}
	
	function limitNumberOfItems(available) {
		return options.max && options.max < available
			? options.max
			: available;
	}
	
	function fillList() {
		list.empty();
		var max = limitNumberOfItems(data.length);
		for (var i=0; i < max; i++) {
			if (!data[i])
				continue;
			var formatted = options.formatItem(data[i].data, i+1, max, data[i].value, term);
			if ( formatted === false )
				continue;
			var li = $("<li/>").html( options.highlight(formatted, term) ).addClass(i%2 == 0 ? "ac_even" : "ac_odd").appendTo(list)[0];
			$.data(li, "ac_data", data[i]);
		}
		listItems = list.find("li");
		if ( options.selectFirst ) {
			listItems.slice(0, 1).addClass(CLASSES.ACTIVE);
			active = 0;
		}
		// apply bgiframe if available
		if ( $.fn.bgiframe )
			list.bgiframe();
	}
	
	return {
		display: function(d, q) {
			init();
			data = d;
			term = q;
			fillList();
		},
		next: function() {
			moveSelect(1);
		},
		prev: function() {
			moveSelect(-1);
		},
		pageUp: function() {
			if (active != 0 && active - 8 < 0) {
				moveSelect( -active );
			} else {
				moveSelect(-8);
			}
		},
		pageDown: function() {
			if (active != listItems.size() - 1 && active + 8 > listItems.size()) {
				moveSelect( listItems.size() - 1 - active );
			} else {
				moveSelect(8);
			}
		},
		hide: function() {
			element && element.hide();
			listItems && listItems.removeClass(CLASSES.ACTIVE);
			active = -1;
		},
		visible : function() {
			return element && element.is(":visible");
		},
		current: function() {
			return this.visible() && (listItems.filter("." + CLASSES.ACTIVE)[0] || options.selectFirst && listItems[0]);
		},
		show: function() {
			var offset = $(input).offset();
			element.css({
				width: typeof options.width == "string" || options.width > 0 ? options.width : $(input).width(),
				top: offset.top + input.offsetHeight,
				left: offset.left
			}).show();
            if(options.scroll) {
                list.scrollTop(0);
                list.css({
					maxHeight: options.scrollHeight,
					overflow: 'auto'
				});
				
                if($.browser.msie && typeof document.body.style.maxHeight === "undefined") {
					var listHeight = 0;
					listItems.each(function() {
						listHeight += this.offsetHeight;
					});
					var scrollbarsVisible = listHeight > options.scrollHeight;
                    list.css('height', scrollbarsVisible ? options.scrollHeight : listHeight );
					if (!scrollbarsVisible) {
						// IE doesn't recalculate width when scrollbar disappears
						listItems.width( list.width() - parseInt(listItems.css("padding-left")) - parseInt(listItems.css("padding-right")) );
					}
                }
                
            }
		},
		selected: function() {
			var selected = listItems && listItems.filter("." + CLASSES.ACTIVE).removeClass(CLASSES.ACTIVE);
			return selected && selected.length && $.data(selected[0], "ac_data");
		},
		emptyList: function (){
			list && list.empty();
		},
		unbind: function() {
			element && element.remove();
		}
	};
};

$.Autocompleter.Selection = function(field, start, end) {
	if( field.createTextRange ){
		var selRange = field.createTextRange();
		selRange.collapse(true);
		selRange.moveStart("character", start);
		selRange.moveEnd("character", end);
		selRange.select();
	} else if( field.setSelectionRange ){
		field.setSelectionRange(start, end);
	} else {
		if( field.selectionStart ){
			field.selectionStart = start;
			field.selectionEnd = end;
		}
	}
	field.focus();
};

})(jQuery);

/*
 * FancyBox - jQuery Plugin
 * Simple and fancy lightbox alternative
 *
 * Examples and documentation at: http://fancybox.net
 * 
 * Copyright (c) 2008 - 2010 Janis Skarnelis
 *
 * Version: 1.3.1 (05/03/2010)
 * Requires: jQuery v1.3+
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */

(function(b){var m,u,x,g,D,i,z,A,B,p=0,e={},q=[],n=0,c={},j=[],E=null,s=new Image,G=/\.(jpg|gif|png|bmp|jpeg)(.*)?$/i,S=/[^\.]\.(swf)\s*$/i,H,I=1,k,l,h=false,y=b.extend(b("<div/>")[0],{prop:0}),v=0,O=!b.support.opacity&&!window.XMLHttpRequest,J=function(){u.hide();s.onerror=s.onload=null;E&&E.abort();m.empty()},P=function(){b.fancybox('<p id="fancybox_error">The requested content cannot be loaded.<br />Please try again later.</p>',{scrolling:"no",padding:20,transitionIn:"none",transitionOut:"none"})},
K=function(){return[b(window).width(),b(window).height(),b(document).scrollLeft(),b(document).scrollTop()]},T=function(){var a=K(),d={},f=c.margin,o=c.autoScale,t=(20+f)*2,w=(20+f)*2,r=c.padding*2;if(c.width.toString().indexOf("%")>-1){d.width=a[0]*parseFloat(c.width)/100-40;o=false}else d.width=c.width+r;if(c.height.toString().indexOf("%")>-1){d.height=a[1]*parseFloat(c.height)/100-40;o=false}else d.height=c.height+r;if(o&&(d.width>a[0]-t||d.height>a[1]-w))if(e.type=="image"||e.type=="swf"){t+=r;
w+=r;o=Math.min(Math.min(a[0]-t,c.width)/c.width,Math.min(a[1]-w,c.height)/c.height);d.width=Math.round(o*(d.width-r))+r;d.height=Math.round(o*(d.height-r))+r}else{d.width=Math.min(d.width,a[0]-t);d.height=Math.min(d.height,a[1]-w)}d.top=a[3]+(a[1]-(d.height+40))*0.5;d.left=a[2]+(a[0]-(d.width+40))*0.5;if(c.autoScale===false){d.top=Math.max(a[3]+f,d.top);d.left=Math.max(a[2]+f,d.left)}return d},U=function(a){if(a&&a.length)switch(c.titlePosition){case "inside":return a;case "over":return'<span id="fancybox-title-over">'+
a+"</span>";default:return'<span id="fancybox-title-wrap"><span id="fancybox-title-left"></span><span id="fancybox-title-main">'+a+'</span><span id="fancybox-title-right"></span></span>'}return false},V=function(){var a=c.title,d=l.width-c.padding*2,f="fancybox-title-"+c.titlePosition;b("#fancybox-title").remove();v=0;if(c.titleShow!==false){a=b.isFunction(c.titleFormat)?c.titleFormat(a,j,n,c):U(a);if(!(!a||a==="")){b('<div id="fancybox-title" class="'+f+'" />').css({width:d,paddingLeft:c.padding,
paddingRight:c.padding}).html(a).appendTo("body");switch(c.titlePosition){case "inside":v=b("#fancybox-title").outerHeight(true)-c.padding;l.height+=v;break;case "over":b("#fancybox-title").css("bottom",c.padding);break;default:b("#fancybox-title").css("bottom",b("#fancybox-title").outerHeight(true)*-1);break}b("#fancybox-title").appendTo(D).hide()}}},W=function(){b(document).unbind("keydown.fb").bind("keydown.fb",function(a){if(a.keyCode==27&&c.enableEscapeButton){a.preventDefault();b.fancybox.close()}else if(a.keyCode==
37){a.preventDefault();b.fancybox.prev()}else if(a.keyCode==39){a.preventDefault();b.fancybox.next()}});if(b.fn.mousewheel){g.unbind("mousewheel.fb");j.length>1&&g.bind("mousewheel.fb",function(a,d){a.preventDefault();h||d===0||(d>0?b.fancybox.prev():b.fancybox.next())})}if(c.showNavArrows){if(c.cyclic&&j.length>1||n!==0)A.show();if(c.cyclic&&j.length>1||n!=j.length-1)B.show()}},X=function(){var a,d;if(j.length-1>n){a=j[n+1].href;if(typeof a!=="undefined"&&a.match(G)){d=new Image;d.src=a}}if(n>0){a=
j[n-1].href;if(typeof a!=="undefined"&&a.match(G)){d=new Image;d.src=a}}},L=function(){i.css("overflow",c.scrolling=="auto"?c.type=="image"||c.type=="iframe"||c.type=="swf"?"hidden":"auto":c.scrolling=="yes"?"auto":"visible");if(!b.support.opacity){i.get(0).style.removeAttribute("filter");g.get(0).style.removeAttribute("filter")}b("#fancybox-title").show();c.hideOnContentClick&&i.one("click",b.fancybox.close);c.hideOnOverlayClick&&x.one("click",b.fancybox.close);c.showCloseButton&&z.show();W();b(window).bind("resize.fb",
b.fancybox.center);c.centerOnScroll?b(window).bind("scroll.fb",b.fancybox.center):b(window).unbind("scroll.fb");b.isFunction(c.onComplete)&&c.onComplete(j,n,c);h=false;X()},M=function(a){var d=Math.round(k.width+(l.width-k.width)*a),f=Math.round(k.height+(l.height-k.height)*a),o=Math.round(k.top+(l.top-k.top)*a),t=Math.round(k.left+(l.left-k.left)*a);g.css({width:d+"px",height:f+"px",top:o+"px",left:t+"px"});d=Math.max(d-c.padding*2,0);f=Math.max(f-(c.padding*2+v*a),0);i.css({width:d+"px",height:f+
"px"});if(typeof l.opacity!=="undefined")g.css("opacity",a<0.5?0.5:a)},Y=function(a){var d=a.offset();d.top+=parseFloat(a.css("paddingTop"))||0;d.left+=parseFloat(a.css("paddingLeft"))||0;d.top+=parseFloat(a.css("border-top-width"))||0;d.left+=parseFloat(a.css("border-left-width"))||0;d.width=a.width();d.height=a.height();return d},Q=function(){var a=e.orig?b(e.orig):false,d={};if(a&&a.length){a=Y(a);d={width:a.width+c.padding*2,height:a.height+c.padding*2,top:a.top-c.padding-20,left:a.left-c.padding-
20}}else{a=K();d={width:1,height:1,top:a[3]+a[1]*0.5,left:a[2]+a[0]*0.5}}return d},N=function(){u.hide();if(g.is(":visible")&&b.isFunction(c.onCleanup))if(c.onCleanup(j,n,c)===false){b.event.trigger("fancybox-cancel");h=false;return}j=q;n=p;c=e;i.get(0).scrollTop=0;i.get(0).scrollLeft=0;if(c.overlayShow){O&&b("select:not(#fancybox-tmp select)").filter(function(){return this.style.visibility!=="hidden"}).css({visibility:"hidden"}).one("fancybox-cleanup",function(){this.style.visibility="inherit"});
x.css({"background-color":c.overlayColor,opacity:c.overlayOpacity}).unbind().show()}l=T();V();if(g.is(":visible")){b(z.add(A).add(B)).hide();var a=g.position(),d;k={top:a.top,left:a.left,width:g.width(),height:g.height()};d=k.width==l.width&&k.height==l.height;i.fadeOut(c.changeFade,function(){var f=function(){i.html(m.contents()).fadeIn(c.changeFade,L)};b.event.trigger("fancybox-change");i.empty().css("overflow","hidden");if(d){i.css({top:c.padding,left:c.padding,width:Math.max(l.width-c.padding*
2,1),height:Math.max(l.height-c.padding*2-v,1)});f()}else{i.css({top:c.padding,left:c.padding,width:Math.max(k.width-c.padding*2,1),height:Math.max(k.height-c.padding*2,1)});y.prop=0;b(y).animate({prop:1},{duration:c.changeSpeed,easing:c.easingChange,step:M,complete:f})}})}else{g.css("opacity",1);if(c.transitionIn=="elastic"){k=Q();i.css({top:c.padding,left:c.padding,width:Math.max(k.width-c.padding*2,1),height:Math.max(k.height-c.padding*2,1)}).html(m.contents());g.css(k).show();if(c.opacity)l.opacity=
0;y.prop=0;b(y).animate({prop:1},{duration:c.speedIn,easing:c.easingIn,step:M,complete:L})}else{i.css({top:c.padding,left:c.padding,width:Math.max(l.width-c.padding*2,1),height:Math.max(l.height-c.padding*2-v,1)}).html(m.contents());g.css(l).fadeIn(c.transitionIn=="none"?0:c.speedIn,L)}}},F=function(){m.width(e.width);m.height(e.height);if(e.width=="auto")e.width=m.width();if(e.height=="auto")e.height=m.height();N()},Z=function(){h=true;e.width=s.width;e.height=s.height;b("<img />").attr({id:"fancybox-img",
src:s.src,alt:e.title}).appendTo(m);N()},C=function(){J();var a=q[p],d,f,o,t,w;e=b.extend({},b.fn.fancybox.defaults,typeof b(a).data("fancybox")=="undefined"?e:b(a).data("fancybox"));o=a.title||b(a).title||e.title||"";if(a.nodeName&&!e.orig)e.orig=b(a).children("img:first").length?b(a).children("img:first"):b(a);if(o===""&&e.orig)o=e.orig.attr("alt");d=a.nodeName&&/^(?:javascript|#)/i.test(a.href)?e.href||null:e.href||a.href||null;if(e.type){f=e.type;if(!d)d=e.content}else if(e.content)f="html";else if(d)if(d.match(G))f=
"image";else if(d.match(S))f="swf";else if(b(a).hasClass("iframe"))f="iframe";else if(d.match(/#/)){a=d.substr(d.indexOf("#"));f=b(a).length>0?"inline":"ajax"}else f="ajax";else f="inline";e.type=f;e.href=d;e.title=o;if(e.autoDimensions&&e.type!=="iframe"&&e.type!=="swf"){e.width="auto";e.height="auto"}if(e.modal){e.overlayShow=true;e.hideOnOverlayClick=false;e.hideOnContentClick=false;e.enableEscapeButton=false;e.showCloseButton=false}if(b.isFunction(e.onStart))if(e.onStart(q,p,e)===false){h=false;
return}m.css("padding",20+e.padding+e.margin);b(".fancybox-inline-tmp").unbind("fancybox-cancel").bind("fancybox-change",function(){b(this).replaceWith(i.children())});switch(f){case "html":m.html(e.content);F();break;case "inline":b('<div class="fancybox-inline-tmp" />').hide().insertBefore(b(a)).bind("fancybox-cleanup",function(){b(this).replaceWith(i.children())}).bind("fancybox-cancel",function(){b(this).replaceWith(m.children())});b(a).appendTo(m);F();break;case "image":h=false;b.fancybox.showActivity();
s=new Image;s.onerror=function(){P()};s.onload=function(){s.onerror=null;s.onload=null;Z()};s.src=d;break;case "swf":t='<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="'+e.width+'" height="'+e.height+'"><param name="movie" value="'+d+'"></param>';w="";b.each(e.swf,function(r,R){t+='<param name="'+r+'" value="'+R+'"></param>';w+=" "+r+'="'+R+'"'});t+='<embed src="'+d+'" type="application/x-shockwave-flash" width="'+e.width+'" height="'+e.height+'"'+w+"></embed></object>";m.html(t);
F();break;case "ajax":a=d.split("#",2);f=e.ajax.data||{};if(a.length>1){d=a[0];if(typeof f=="string")f+="&selector="+a[1];else f.selector=a[1]}h=false;b.fancybox.showActivity();E=b.ajax(b.extend(e.ajax,{url:d,data:f,error:P,success:function(r){if(E.status==200){m.html(r);F()}}}));break;case "iframe":b('<iframe id="fancybox-frame" name="fancybox-frame'+(new Date).getTime()+'" frameborder="0" hspace="0" scrolling="'+e.scrolling+'" src="'+e.href+'"></iframe>').appendTo(m);N();break}},$=function(){if(u.is(":visible")){b("div",
u).css("top",I*-40+"px");I=(I+1)%12}else clearInterval(H)},aa=function(){if(!b("#fancybox-wrap").length){b("body").append(m=b('<div id="fancybox-tmp"></div>'),u=b('<div id="fancybox-loading"><div></div></div>'),x=b('<div id="fancybox-overlay"></div>'),g=b('<div id="fancybox-wrap"></div>'));if(!b.support.opacity){g.addClass("fancybox-ie");u.addClass("fancybox-ie")}D=b('<div id="fancybox-outer"></div>').append('<div class="fancy-bg" id="fancy-bg-n"></div><div class="fancy-bg" id="fancy-bg-ne"></div><div class="fancy-bg" id="fancy-bg-e"></div><div class="fancy-bg" id="fancy-bg-se"></div><div class="fancy-bg" id="fancy-bg-s"></div><div class="fancy-bg" id="fancy-bg-sw"></div><div class="fancy-bg" id="fancy-bg-w"></div><div class="fancy-bg" id="fancy-bg-nw"></div>').appendTo(g);
D.append(i=b('<div id="fancybox-inner"></div>'),z=b('<a id="fancybox-close"></a>'),A=b('<a href="javascript:;" id="fancybox-left"><span class="fancy-ico" id="fancybox-left-ico"></span></a>'),B=b('<a href="javascript:;" id="fancybox-right"><span class="fancy-ico" id="fancybox-right-ico"></span></a>'));z.click(b.fancybox.close);u.click(b.fancybox.cancel);A.click(function(a){a.preventDefault();b.fancybox.prev()});B.click(function(a){a.preventDefault();b.fancybox.next()});if(O){x.get(0).style.setExpression("height",
"document.body.scrollHeight > document.body.offsetHeight ? document.body.scrollHeight : document.body.offsetHeight + 'px'");u.get(0).style.setExpression("top","(-20 + (document.documentElement.clientHeight ? document.documentElement.clientHeight/2 : document.body.clientHeight/2 ) + ( ignoreMe = document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop )) + 'px'");D.prepend('<iframe id="fancybox-hide-sel-frame" src="javascript:\'\';" scrolling="no" frameborder="0" ></iframe>')}}};
b.fn.fancybox=function(a){b(this).data("fancybox",b.extend({},a,b.metadata?b(this).metadata():{})).unbind("click.fb").bind("click.fb",function(d){d.preventDefault();if(!h){h=true;b(this).blur();q=[];p=0;d=b(this).attr("rel")||"";if(!d||d==""||d==="nofollow")q.push(this);else{q=b("a[rel="+d+"], area[rel="+d+"]");p=q.index(this)}C();return false}});return this};b.fancybox=function(a,d){if(!h){h=true;d=typeof d!=="undefined"?d:{};q=[];p=d.index||0;if(b.isArray(a)){for(var f=0,o=a.length;f<o;f++)if(typeof a[f]==
"object")b(a[f]).data("fancybox",b.extend({},d,a[f]));else a[f]=b({}).data("fancybox",b.extend({content:a[f]},d));q=jQuery.merge(q,a)}else{if(typeof a=="object")b(a).data("fancybox",b.extend({},d,a));else a=b({}).data("fancybox",b.extend({content:a},d));q.push(a)}if(p>q.length||p<0)p=0;C()}};b.fancybox.showActivity=function(){clearInterval(H);u.show();H=setInterval($,66)};b.fancybox.hideActivity=function(){u.hide()};b.fancybox.next=function(){return b.fancybox.pos(n+1)};b.fancybox.prev=function(){return b.fancybox.pos(n-
1)};b.fancybox.pos=function(a){if(!h){a=parseInt(a,10);if(a>-1&&j.length>a){p=a;C()}if(c.cyclic&&j.length>1&&a<0){p=j.length-1;C()}if(c.cyclic&&j.length>1&&a>=j.length){p=0;C()}}};b.fancybox.cancel=function(){if(!h){h=true;b.event.trigger("fancybox-cancel");J();e&&b.isFunction(e.onCancel)&&e.onCancel(q,p,e);h=false}};b.fancybox.close=function(){function a(){x.fadeOut("fast");g.hide();b.event.trigger("fancybox-cleanup");i.empty();b.isFunction(c.onClosed)&&c.onClosed(j,n,c);j=e=[];n=p=0;c=e={};h=false}
if(!(h||g.is(":hidden"))){h=true;if(c&&b.isFunction(c.onCleanup))if(c.onCleanup(j,n,c)===false){h=false;return}J();b(z.add(A).add(B)).hide();b("#fancybox-title").remove();g.add(i).add(x).unbind();b(window).unbind("resize.fb scroll.fb");b(document).unbind("keydown.fb");i.css("overflow","hidden");if(c.transitionOut=="elastic"){k=Q();var d=g.position();l={top:d.top,left:d.left,width:g.width(),height:g.height()};if(c.opacity)l.opacity=1;y.prop=1;b(y).animate({prop:0},{duration:c.speedOut,easing:c.easingOut,
step:M,complete:a})}else g.fadeOut(c.transitionOut=="none"?0:c.speedOut,a)}};b.fancybox.resize=function(){var a,d;if(!(h||g.is(":hidden"))){h=true;a=i.wrapInner("<div style='overflow:auto'></div>").children();d=a.height();g.css({height:d+c.padding*2+v});i.css({height:d});a.replaceWith(a.children());b.fancybox.center()}};b.fancybox.center=function(){h=true;var a=K(),d=c.margin,f={};f.top=a[3]+(a[1]-(g.height()-v+40))*0.5;f.left=a[2]+(a[0]-(g.width()+40))*0.5;f.top=Math.max(a[3]+d,f.top);f.left=Math.max(a[2]+
d,f.left);g.css(f);h=false};b.fn.fancybox.defaults={padding:10,margin:20,opacity:false,modal:false,cyclic:false,scrolling:"auto",width:560,height:340,autoScale:true,autoDimensions:true,centerOnScroll:false,ajax:{},swf:{wmode:"transparent"},hideOnOverlayClick:true,hideOnContentClick:false,overlayShow:true,overlayOpacity:0.3,overlayColor:"#666",titleShow:true,titlePosition:"outside",titleFormat:null,transitionIn:"fade",transitionOut:"fade",speedIn:300,speedOut:300,changeSpeed:300,changeFade:"fast",
easingIn:"swing",easingOut:"swing",showCloseButton:true,showNavArrows:true,enableEscapeButton:true,onStart:null,onCancel:null,onComplete:null,onCleanup:null,onClosed:null};b(document).ready(function(){aa()})})(jQuery);
/**
 * jQuery.ScrollTo - Easy element scrolling using jQuery.
 * Copyright (c) 2007-2009 Ariel Flesler - aflesler(at)gmail(dot)com | http://flesler.blogspot.com/
 * Dual licensed under MIT and GPL.
 * Date: 5/25/2009
 * @author Ariel Flesler
 * @version 1.4.2
 *
 * http://flesler.blogspot.com/2007/10/jqueryscrollto.html
 */
;(function(d){var k=d.scrollTo=function(a,i,e){d(window).scrollTo(a,i,e)};k.defaults={axis:'xy',duration:parseFloat(d.fn.jquery)>=1.3?0:1};k.window=function(a){return d(window)._scrollable()};d.fn._scrollable=function(){return this.map(function(){var a=this,i=!a.nodeName||d.inArray(a.nodeName.toLowerCase(),['iframe','#document','html','body'])!=-1;if(!i)return a;var e=(a.contentWindow||a).document||a.ownerDocument||a;return d.browser.safari||e.compatMode=='BackCompat'?e.body:e.documentElement})};d.fn.scrollTo=function(n,j,b){if(typeof j=='object'){b=j;j=0}if(typeof b=='function')b={onAfter:b};if(n=='max')n=9e9;b=d.extend({},k.defaults,b);j=j||b.speed||b.duration;b.queue=b.queue&&b.axis.length>1;if(b.queue)j/=2;b.offset=p(b.offset);b.over=p(b.over);return this._scrollable().each(function(){var q=this,r=d(q),f=n,s,g={},u=r.is('html,body');switch(typeof f){case'number':case'string':if(/^([+-]=)?\d+(\.\d+)?(px|%)?$/.test(f)){f=p(f);break}f=d(f,this);case'object':if(f.is||f.style)s=(f=d(f)).offset()}d.each(b.axis.split(''),function(a,i){var e=i=='x'?'Left':'Top',h=e.toLowerCase(),c='scroll'+e,l=q[c],m=k.max(q,i);if(s){g[c]=s[h]+(u?0:l-r.offset()[h]);if(b.margin){g[c]-=parseInt(f.css('margin'+e))||0;g[c]-=parseInt(f.css('border'+e+'Width'))||0}g[c]+=b.offset[h]||0;if(b.over[h])g[c]+=f[i=='x'?'width':'height']()*b.over[h]}else{var o=f[h];g[c]=o.slice&&o.slice(-1)=='%'?parseFloat(o)/100*m:o}if(/^\d+$/.test(g[c]))g[c]=g[c]<=0?0:Math.min(g[c],m);if(!a&&b.queue){if(l!=g[c])t(b.onAfterFirst);delete g[c]}});t(b.onAfter);function t(a){r.animate(g,j,b.easing,a&&function(){a.call(this,n,b)})}}).end()};k.max=function(a,i){var e=i=='x'?'Width':'Height',h='scroll'+e;if(!d(a).is('html,body'))return a[h]-d(a)[e.toLowerCase()]();var c='client'+e,l=a.ownerDocument.documentElement,m=a.ownerDocument.body;return Math.max(l[h],m[h])-Math.min(l[c],m[c])};function p(a){return typeof a=='object'?a:{top:a,left:a}}})(jQuery);
/**
 * writeCapture.js v1.0.5
 *
 * @author noah <noah.sloan@gmail.com>
 * 
 */
(function($,global) {
	var doc = global.document;
	function doEvil(code) {
		var div = doc.createElement('div');
		doc.body.insertBefore(div,null);
		$.replaceWith(div,'<script type="text/javascript">'+code+'</script>');
	}
	// ensure we have our support functions
	$ = $ || (function(jQuery) {
		/**
		 * @name writeCaptureSupport
		 *
		 * The support functions writeCapture needs.
		 */		
		return {
			/**
			 * Takes an options parameter that must support the following:
			 * {
			 * 	url: url,
			 * 	type: 'GET', // all requests are GET
			 * 	dataType: "script", // it this is set to script, script tag injection is expected, otherwise, treat as plain text
			 * 	async: true/false, // local scripts are loaded synchronously by default
			 * 	success: callback(text,status), // must not pass a truthy 3rd parameter
			 * 	error: callback(xhr,status,error) // must pass truthy 3rd parameter to indicate error
			 * }
			 */
			ajax: jQuery.ajax,
			/**
			 * @param {String Element} selector an Element or selector
			 * @return {Element} the first element matching selector
			 */
			$: function(s) { return jQuery(s)[0]; },
			/**
			 * @param {String jQuery Element} selector the element to replace.
			 * writeCapture only needs the first matched element to be replaced.
			 * @param {String} content the content to replace 
			 * the matched element with. script tags must be evaluated/loaded 
			 * and executed if present.
			 */
			replaceWith: function(selector,content) {
				// jQuery 1.4? has a bug in replaceWith so we can't use it directly
				var el = jQuery(selector)[0];
				var next = el.nextSibling, parent = el.parentNode;

				jQuery(el).remove();

				if ( next ) {
					jQuery(next).before( content );
				} else {
					jQuery(parent).append( content );
				}
			},

			onLoad: function(fn) {
				jQuery(fn);
			},
			
			copyAttrs: function(src,dest) {
				var el = jQuery(dest), attrs = src.attributes;
				for (var i = 0, len = attrs.length; i < len; i++) {
					if(attrs[i] && attrs[i].value) {
						try {
							el.attr(attrs[i].name,attrs[i].value);
						} catch(e) { }
					}
				}
			}
		};
	})(global.jQuery);

	$.copyAttrs = $.copyAttrs || function() {};
	$.onLoad = $.onLoad || function() {
		throw "error: autoAsync cannot be used without jQuery " +
			"or defining writeCaptureSupport.onLoad";
	};

	// utilities
	function each(array,fn) {
		for(var i =0, len = array.length; i < len; i++) { 
			if( fn(array[i]) === false) return; 
		}
	}	
	function isFunction(o) {
		return Object.prototype.toString.call(o) === "[object Function]";
	}
	function isString(o) {
		return Object.prototype.toString.call(o) === "[object String]";
	}	
	function slice(array,start,end) {
		return Array.prototype.slice.call(array,start || 0,end || array && array.length);		
	}
	function any(array,fn) {
		var result = false;
		each(array,check);
		function check(it) {
			return !(result = fn(it));
		}
		return result;
	}
	
	function SubQ(parent) {
		this._queue = [];
		this._children = [];
		this._parent = parent;
		if(parent) parent._addChild(this);
	}
	
	SubQ.prototype = {
		_addChild: function(q) {
			this._children.push(q);
		},
		push: function (task) {
			this._queue.push(task);
			this._bubble('_doRun');
		},
		pause: function() {
			this._bubble('_doPause');
		},
		resume: function() {
			this._bubble('_doResume');
		},
		_bubble: function(name) {
			var root = this;
			while(!root[name]) {
				root = root._parent;
			}
			return root[name]();
		},
		_next: function() {
			if(any(this._children,runNext)) return true;
			function runNext(c) {
				return c._next();
			}
			var task = this._queue.shift();
			if(task) {
				task();
			}
			return !!task;
		}
	};
	
	/**
	 * Provides a task queue for ensuring that scripts are run in order.
	 *
	 * The only public methods are push, pause and resume.
	 */
	function Q(parent) {
		if(parent) {
			return new SubQ(parent);
		}
		SubQ.call(this);
		this.paused = 0;
	}
	
	Q.prototype = (function() {
		function f() {}
		f.prototype = SubQ.prototype;
		return new f();
	})();
	
	Q.prototype._doRun = function() {
		if(!this.running) {
			this.running = true;
			try {
				// just in case there is a bug, always resume 
				// if paused is less than 1
				while(this.paused < 1 && this._next());
			} finally {
				this.running = false;
			}
		}
	};
	Q.prototype._doPause= function() {
		this.paused++;
	};
	Q.prototype._doResume = function() {
		this.paused--;
		this._doRun();
	};
	
	// TODO unit tests...
	function MockDocument() { }
	MockDocument.prototype = {
		_html: '',
		open: function( ) { 
			this._opened = true;
			if(this._delegate) {
				this._delegate.open();
			}
		},
		write: function(s) { 
			if(this._closed) return; 
			this._written = true;
			if(this._delegate) {
				this._delegate.write(s);
			} else {
				this._html += s;
			}
		}, 
		writeln: function(s) { 
			this.write(s + '\n');
		}, 
		close: function( ) { 
			this._closed = true;
			if(this._delegate) {
				this._delegate.close();
			}
		}, 
		copyTo: function(d) { 
			this._delegate = d;
			d.foobar = true;
			if(this._opened) {
				d.open();
			}
			if(this._written) {
				d.write(this._html); 
			}
			if(this._closed) {
				d.close();
			}
		}
	};
	
	// test for IE 6/7 issue (issue 6) that prevents us from using call
	var canCall = (function() {
		var f = { f: doc.getElementById };
		try {
			f.f.call(doc,'abc');
			return true;
		} catch(e) {
			return false;
		}
	})();
	
	function unProxy(elements) {
		each(elements,function(it) {
			var real = doc.getElementById(it.id);
			if(!real) {
				logError('<proxyGetElementById - finish>',
					'no element in writen markup with id ' + it.id);
				return;
			}

			each(it.el.childNodes,function(it) {
				real.appendChild(it);
			});

			if(real.contentWindow) {
				// TODO why is the setTimeout necessary?
				global.setTimeout(function() {
					it.el.contentWindow.document.
						copyTo(real.contentWindow.document);
				},1);
			}
			$.copyAttrs(it.el,real);
		});
	}
	
	function getOption(name,options) {
		if(options && options[name] === false) {
			return false;
		}
		return options && options[name] || self[name];
	}
	
	function capture(context,options) {
		var tempEls = [],
			proxy = getOption('proxyGetElementById',options),
			writeOnGet = getOption('writeOnGetElementById',options),	
			state = {
				write: doc.write,
				writeln: doc.writeln,
				finish: function() {},
				out: ''
			};
		context.state = state;
		doc.write = replacementWrite;
		doc.writeln = replacementWriteln;
		if(proxy || writeOnGet) {
			state.getEl = doc.getElementById;
			doc.getElementById = getEl;
			if(writeOnGet) {
				findEl = writeThenGet;
			} else {
				findEl = makeTemp;
				state.finish = function() {
					unProxy(tempEls);
				};
			}
		}
		function replacementWrite(s) {
			state.out +=  s;
		}
		function replacementWriteln(s) {
			state.out +=  s + '\n';
		}
		function makeTemp(id) {
			var t = doc.createElement('div');
			tempEls.push({id:id,el:t});
			// mock contentWindow in case it's supposed to be an iframe
			t.contentWindow = { document: new MockDocument() };
			return t;
		}
		function writeThenGet(id) {
			var target = $.$(context.target);
			var div = doc.createElement('div');
			target.parentNode.insertBefore(div,target);
			$.replaceWith(div,state.out);
			state.out = '';
			return canCall ? state.getEl.call(doc,id) : 
				state.getEl(id);
		}
		function getEl(id) {
			var result = canCall ? state.getEl.call(doc,id) : 
				state.getEl(id);
			return result || findEl(id);
		}
		return state;
	}
	function uncapture(state) {
		doc.write = state.write;
		doc.writeln = state.writeln;
		if(state.getEl) {
			doc.getElementById = state.getEl;
		}
		return state.out;
	}
	
	function clean(code) {
		// IE will execute inline scripts with <!-- (uncommented) on the first
		// line, but will not eval() them happily
		return code && code.replace(/^\s*<!(\[CDATA\[|--)/,'').replace(/(\]\]|--)>\s*$/,'');
	}
	
	function ignore() {}
	function doLog(code,error) {
		console.error("Error",error,"executing code:",code);
	}
	
	var logError = isFunction(global.console && console.error) ? 
			doLog : ignore;
	
	function captureWrite(code,context,options) {
		var state = capture(context,options);
		try {
			doEvil(clean(code));
		} catch(e) {
			logError(code,e);
		} finally {
			uncapture(state);
		}
		return state;
	}
	
	// copied from jQuery
	function isXDomain(src) {
		var parts = /^(\w+:)?\/\/([^\/?#]+)/.exec(src);
		return parts && ( parts[1] && parts[1] != location.protocol || parts[2] != location.host );
	}
	
	function attrPattern(name) {
		return new RegExp(name+'=(?:(["\'])([\\s\\S]*?)\\1|([^\\s>]+))','i');
	}
	
	function matchAttr(name) {
		var regex = attrPattern(name);
		return function(tag) {
			var match = regex.exec(tag) || [];
			return match[2] || match[3];
		};
	}
	
	var SCRIPT_TAGS = /(<script[\s\S]*?>)([\s\S]*?)<\/script>/ig, 
		SRC_REGEX = attrPattern('src'),
		SRC_ATTR = matchAttr('src'),
		TYPE_ATTR = matchAttr('type'),
		LANG_ATTR = matchAttr('language'),
		GLOBAL = "__document_write_ajax_callbacks__",
		DIV_PREFIX = "__document_write_ajax_div-",
		TEMPLATE = "window['"+GLOBAL+"']['%d']();",
		callbacks = global[GLOBAL] = {},
		TEMPLATE_TAG = '<script type="text/javascript">' + TEMPLATE + '</script>',
		global_id = 0;
	function nextId() {
		return (++global_id).toString();
	}
	
	function normalizeOptions(options,callback) {
		var done;
		if(isFunction(options)) {
			done = options;
			options = null;
		}
		options = options || {};
		done = done || options && options.done;
		options.done = callback ? function() {
			callback(done);
		} : done;
		return options;
	}
	
	// The global Q synchronizes all sanitize operations. 
	// The only time this synchronization is really necessary is when two or 
	// more consecutive sanitize operations make async requests. e.g.,
	// sanitize call A requests foo, then sanitize B is called and bar is 
	// requested. document.write was replaced by B, so if A returns first, the 
	// content will be captured by B, then when B returns, document.write will
	// be the original document.write, probably messing up the page. At the 
	// very least, A will get nothing and B will get the wrong content.
	var GLOBAL_Q = new Q();
	
	var debug = [];
	var logDebug = window._debugWriteCapture ? function() {} :
		function (type,src,data) {
		    debug.push({type:type,src:src,data:data});
		};

	var logString = window._debugWriteCapture ? function() {} :
		function () {
			debug.push(arguments);
		};

	function newCallback(fn) {
		var id = nextId();
		callbacks[id] = function() {
			fn();
			delete callbacks[id];
		};
		return id;
	}
	
	function newCallbackTag(fn) {			
		return TEMPLATE_TAG.replace(/%d/,newCallback(fn));
	}	

	/**
	 * Sanitize the given HTML so that the scripts will execute with a modified
	 * document.write that will capture the output and append it in the 
	 * appropriate location.  
	 * 
	 * @param {String} html
	 * @param {Object Function} [options]
	 * @param {Function} [options.done] Called when all the scripts in the 
	 * sanitized HTML have run.
	 * @param {boolean} [options.asyncAll] If true, scripts loaded from the
	 * same domain will be loaded asynchronously. This can improve UI 
	 * responsiveness, but will delay completion of the scripts and may
	 * cause problems with some scripts, so it defaults to false.
	 */
	function sanitize(html,options,parentQ,parentContext) {
		// each HTML fragment has it's own queue
		var queue = parentQ && new Q(parentQ) || GLOBAL_Q;
		options = normalizeOptions(options);
		var done = getOption('done',options);
		var doneHtml = '';
		
		var fixUrls = getOption('fixUrls',options);
		if(!isFunction(fixUrls)) {
			fixUrls = function(src) { return src; };
		}
		
		// if a done callback is passed, append a script to call it
		if(isFunction(done)) {
			// no need to proxy the call to done, so we can append this to the 
			// filtered HTML
			doneHtml = newCallbackTag(function() {
				queue.push(done);
			});
		}
		// for each tag, generate a function to load and eval the code and queue
		// themselves
		return html.replace(SCRIPT_TAGS,proxyTag) + doneHtml;
		function proxyTag(element,openTag,code) {
			var src = SRC_ATTR(openTag),
				type = TYPE_ATTR(openTag) || '',
				lang = LANG_ATTR(openTag) || '',
				isJs = (!type && !lang) || // no type or lang assumes JS
					type.toLowerCase().indexOf('javascript') !== -1 || 
					lang.toLowerCase().indexOf('javascript') !== -1;
			
			logDebug('replace',src,element);
			
			if(!isJs) {
			    return element;
			}
			
			var id = newCallback(queueScript), divId = DIV_PREFIX + id,
				run, context = { target: '#' + divId, parent: parentContext };
			
			function queueScript() {
				queue.push(run);
			}
			
			if(src) {
				// fix for the inline script that writes a script tag with encoded 
				// ampersands hack (more comon than you'd think)
				src = fixUrls(src);
								
				openTag = openTag.replace(SRC_REGEX,'');
				if(isXDomain(src)) {
					// will load async via script tag injection (eval()'d on
					// it's own)
					run = loadXDomain;
				} else {
					// can be loaded then eval()d
					if(getOption('asyncAll',options)) {
						run = loadAsync();
					} else {
						run = loadSync;
					}
				}
			} else {
				// just eval code and be done
				run = runInline;
				                  
			}
			function runInline() {
				captureHtml(code);
			}
			function loadSync() {
				$.ajax({
					url: src,
					type: 'GET',
					dataType: 'text',
					async: false,
					success: function(html) {
						captureHtml(html);
					}	
				});
			}
			function logAjaxError(xhr,status,error) {
				logError("<XHR for "+src+">",error);
				queue.resume();
			}
			function setupResume() {
				return newCallbackTag(function() {
					queue.resume();
				});
			}
			function loadAsync() {
				var ready, scriptText;
				function captureAndResume(script,status) {
					if(!ready) {
						// loaded before queue run, cache text
						scriptText = script;
						return;
					}
					try {
						captureHtml(script, setupResume());
					} catch(e) {
						logError(script,e);
					}
				}
				// start loading the text
				$.ajax({
					url: src,
					type: 'GET',
					dataType: 'text',
					async: true,
					success: captureAndResume,
					error: logAjaxError
				});				
				return function() {
					ready = true;
					if(scriptText) {
						// already loaded, so don't pause the queue and don't resume!
						captureHtml(scriptText);
					} else {
						queue.pause();	
					}
				};
			}
			function loadXDomain(cb) {
				var state = capture(context,options);
				queue.pause(); // pause the queue while the script loads
				logDebug('pause',src);
				$.ajax({
					url: src,
					type: 'GET',
					dataType: "script",
					success: captureAndResume,
					error: logAjaxError
				});
				function captureAndResume(xhr,st,error) {
					logDebug('out', src, state.out);
					html(uncapture(state), 
						newCallbackTag(state.finish) + setupResume());
					logDebug('resume',src);
				}
			}
			function captureHtml(script, cb) {
				var state = captureWrite(script,context,options);
				cb = newCallbackTag(state.finish) + (cb || '');
				html(state.out,cb);
			}
			function html(markup,cb) {
			 	$.replaceWith(context.target,sanitize(markup,null,queue,context) + (cb || ''));
			} 
			return '<div style="display: none" id="'+divId+'"></div>' + openTag +
				TEMPLATE.replace(/%d/,id) + '</script>';
		}
	}
	
	/**
	 * Sanitizes all the given fragments and calls action with the HTML.
	 * The next fragment is not started until the previous fragment
	 * has executed completely.
	 * 
	 * @param {Array} fragments array of objects like this:
	 * {
	 *   html: '<p>My html with a <script...',
	 *   action: function(safeHtml,frag) { doSomethingToInject(safeHtml); },
	 *   options: {} // optional, see #sanitize
	 * }
	 * Where frag is the object.
	 * 
	 * @param {Function} [done] Optional. Called when all fragments are done.
	 */
	function sanitizeSerial(fragments,done) {
		// create a queue for these fragments and make it the parent of each 
		// sanitize call
		var queue = GLOBAL_Q;
		each(fragments, function (f) {
			queue.push(run);
			function run() {
				f.action(sanitize(f.html,f.options,queue),f);
			}
		});
		if(done) {
			queue.push(done);		
		}
	}
	
	function findLastChild(el) {
		var n = el;
		while(n && n.nodeType === 1) {
			el = n;
			n = n.lastChild;
			// last child may not be an element
			while(n && n.nodeType !== 1) {
				n = n.previousSibling;
			}
		}
		return el;
	}
		
	/**
	  * Experimental - automatically captures document.write calls and 
	  * defers them untill after page load.
	  * @param {Function} [done] optional callback for when all the 
	  * captured content has been loaded.
	  */
	function autoCapture(done) {
		var write = doc.write, 
			writeln = doc.writeln,
			currentScript,
			autoQ = [];
		doc.writeln = function(s) {
			doc.write(s+'\n');
		};
		var state;
		doc.write = function(s) {
			var scriptEl = findLastChild(doc.body);
			if(scriptEl !== currentScript) {
				currentScript = scriptEl;
				autoQ.push(state = {
					el: scriptEl,
					out: []
				});					
			}
			state.out.push(s);
		};
		$.onLoad(function() {			
			// for each script, append a div immediately after it, 
			// then replace the div with the sanitized output
			var el, div, out, safe, doneFn;
			done = normalizeOptions(done);
			doneFn = done.done;
			done.done = function() {
				doc.write = write;
				doc.writeln = writeln;
				if(doneFn) doneFn();				
			};
			for(var i = 0, len = autoQ.length; i < len; i++ ) {
				el = autoQ[i].el;
				div = doc.createElement('div');
				el.parentNode.insertBefore( div, el.nextSibling );
				out = autoQ[i].out.join('');
				// only the last snippet gets passed the callback
				safe = len - i === 1 ? sanitize(out,done) : sanitize(out);
				$.replaceWith(div,safe);
			}
		});
	}
	
	var name = 'writeCapture';
	var self = global[name] = {
		_original: global[name],
		/**
		 */
		fixUrls: function(src) {
		    return src.replace(/&amp;/g,'&');
		},
		noConflict: function() {
			global[name] = this._original;
			return this;
		},
		debug: debug,
		/**
		 * Enables a fun little hack that replaces document.getElementById and
		 * creates temporary elements for the calling code to use.
		 */
		proxyGetElementById: false,
		// this is only for testing, please don't use these
		_forTest: {
			Q: Q,
			GLOBAL_Q: GLOBAL_Q,
			$: $,
			matchAttr: matchAttr,
			slice: slice,
			capture: capture,
			uncapture: uncapture,
			captureWrite: captureWrite
		},
		replaceWith: function(selector,content,options) {
			$.replaceWith(selector,sanitize(content,options));
		},
		html: function(selector,content,options) {
			var el = $.$(selector);
			el.innerHTML ='<span/>';
			$.replaceWith(el.firstChild,sanitize(content,options));
		},	
		load: function(selector,url,options) {
			$.ajax({
				url: url,
				dataType: 'text',
				type: "GET",
				success: function(content) {
					self.html(selector,content,options);
				}
			});
		},
		autoAsync: autoCapture,
		sanitize: sanitize,
		sanitizeSerial: sanitizeSerial
	};
	
})(this.writeCaptureSupport,this);
var DAILYCANDY = DAILYCANDY || {};

$(document).ready(function() {
    DAILYCANDY.account.init();
    DAILYCANDY.utils.searchGo();
    DAILYCANDY.utils.dropDown();
    DAILYCANDY.utils.tooltips();
    DAILYCANDY.utils.shareBox();
    DAILYCANDY.utils.action();
    DAILYCANDY.utils.autocompleteSearch();
    DAILYCANDY.utils.photoGallery();
    DAILYCANDY.utils.modalLogin();
    DAILYCANDY.onestepsignup();
    DAILYCANDY.video.init();
    DAILYCANDY.profile.init();

    $('form.signup-form input[type="submit"]').attr("disabled", "false"); 
    $('form.signup-form input[type="submit"]').removeAttr("disabled");

    $('#list-items').bind('sortstart', function(event, ui){
        document.onselectstart = function() { return false; };
    }).bind('sortstop', function(event, ui){
        document.onselectstart = function() { return true; };
    });
            
    $('a[href="/logout.jsp"]').click(function(event){
        $.cookie("subscribed-swirl", null, {path: '/'});
    }); 
    
    /* Input text placeholders */
    if(!Modernizr.input.placeholder){

        $('[placeholder]').focus(function() {
          var input = $(this);
          if (input.val() == input.attr('placeholder')) {
            input.val('');
            input.removeClass('placeholder');
          }
        }).blur(function() {
          var input = $(this);
          if (input.val() === '' || input.val() == input.attr('placeholder')) {
            input.addClass('placeholder');
            input.val(input.attr('placeholder'));
          }
        }).blur();

        $('[placeholder]').parents('form').submit(function() {
          $(this).find('[placeholder]').each(function() {
            var input = $(this);
            if (input.val() === input.attr('placeholder')) {
              input.val('');
            }
          });
        });
    }
    
    /* Forgot Password */
    $("a.forgot-password").click(function() {
        $.fancybox('/tools/password.jsp?iframe&email='+ $("#email").val(), {
            'type' : 'iframe',
            'padding': 10,
            'height': 290,
            'width': 430,
            'zoomSpeedIn': 300,
            'zoomSpeedOut': 300
        });
        return false;
    });

    /* Submit correction */
    $("#module-article-tools a.correct").fancybox({
        'overlayShow': true,
        'padding': 0,
        'frameWidth': 502,
        'frameHeight': 425,
        'hideOnContentClick': false,
        'centerOnScroll': false,
        'zoomSpeedIn': 300,
        'zoomSpeedOut': 300
    });

    /* Unsubscribe form */
    $('#module-account-subscriptions form.subscribe').submit(function() {
        $.cookie("subscribed-swirl", null, {path: '/'});
        return true;
    });
    
    /* Subscribe forms */
    $('#subscribe-form').submit(function() {
        $.cookie("subscribed-swirl", null, {path: '/'});
        return true; 
    }); 

    $('form.signup-form').submit(function() {
        var $that   = $(this);
        var $errors = $(this).find("ul.errors");
        $that.find('input[type="submit"]').attr("disabled", "true");
        var email =  $(this).find(".email").val();
        
        DAILYCANDY.subscriber.create( email, $(this).serializeArray(), {
            error: function() {
                $that.find('input[type="submit"]').attr("disabled", "false");
                $that.find('input[type="submit"]').removeAttr("disabled");

                $errors.empty();
                $errors.append("<li>Sorry, there was an error processing the form.</li>");
                $errors.fadeIn("fast");
            },
            beforeSend: function() {
                $errors.hide();
                $that.find('input[type="submit"]').attr("disabled", "true");
                $that.find('input[type="submit"]').attr("value", "Loading");
            },
            invalid: function(fieldErrors, globalErrors) {
                $errors.empty();
                $that.find('input[type="submit"]').attr("disabled", "false");
                $that.find('input[type="submit"]').removeAttr("disabled");
                $that.find('input[type="submit"]').attr("value", "Subscribe");

                if (fieldErrors) {
                    for (var i = 0, ii = fieldErrors.length; i < ii; i++) {
                        var err = fieldErrors[i];
                        if (err.field == "email") {
                            $errors.append('<li>Please check your email address.</li>');
                        }
                        if (err.field == "editions") {
                            $errors.append('<li>Please pick at least one edition.</li>', function() { $('#onestepsignup a.showEditionList').click(); });
                        }
                    }
                }
                if (globalErrors) {
                    for (var j = 0, jj = globalErrors.length; j < jj; j++) {
                        var globalErr = globalErrors[j];
                        $errors.append('<li>'+globalErr.message+'</li>');
                    }
                }
                $errors.show();
            },
            valid: function(json) {
                $errors.hide();             
                $that.find('input[type="submit"]').attr("disabled", "true");
                
                var ftouch = $('input[name="ftouch"]').val();
                var cmpgn = $('input[name="cmpgn"]').val();
                
                if(ftouch){
                    window.location = "/account/upgrade.jsp?source=subscribe&onestep=1&edition="+$('input[name="editions"]').val()+"&ftouch="+ftouch;
                }else if(cmpgn){
                    window.location = "/account/upgrade.jsp?source=subscribe&cmpgn="+cmpgn+"&onestep=1&edition="+$('input[name="editions"]').val();
                }else {
                    window.location = "/account/upgrade.jsp?source=subscribe&onestep=1&edition="+$('input[name="editions"]').val();
                }
            }
        });

        return false;
    });
});

DAILYCANDY = {
    omniture: {
        delay: false
    },
    utils: {
        tooltips: function() {
            var xOffset = 10;
            var yOffset = 20;
            $("a.tooltip, span.tooltip, h2.tooltip").hover(function(e) {
                this.t = this.title;
                this.title = "";
                $("body").append("<span id='tooltip'>"+ this.t +"</span>");
                $("#tooltip")
                    .css("top",(e.pageY - xOffset) + "px")
                    .css("left",(e.pageX + yOffset) + "px")
                    .fadeIn("fast");
            },
            function() {
                this.title = this.t;
                $("#tooltip").remove();
            });
            $("a.tooltip, span.tooltip, h2.tooltip").mousemove(function(e) {
                $("#tooltip")
                    .css("top",(e.pageY - xOffset) + "px")
                    .css("left",(e.pageX + yOffset) + "px");
            });
        },
        citiesMenu: function(){
            $("#module-header").find("#module-brand ul").each(function() {
                $(this).hover(function() {
                    $("ul", this).show();
                }, function() {
                    $("ul", this).hide();
                });
            });
        },
        modalLogin: function(){
            $(".loginModal").fancybox({
                'href'          : "/modal/login.jsp",
                'width'         : 340,
                'height'        : 160,
                'autoScale'     : false,
                'transitionIn'  : 'none',
                'transitionOut' : 'none',
                'type'          : 'iframe',
                'centerOnScroll': 'true',
                'scrolling'     : 'no',
                'titleShow'     : false
            });
        },
        photoGallery: function() {
            if ($("#module-photo-gallery").find("#showLastCard").length > 0 && $("#module-photo-gallery").find("#module-last-card").length > 0) {
                $("#module-photo-gallery").find("#showLastCard").click(function() {
                    $("#module-photo-gallery").find("#module-last-card").fadeIn("fast").css("height", $("#module-photo-gallery").height());
                });
            } else {
                $("#showLastCard").parent().hide();
            }

            $("#module-last-card").find(".close").click(function() {
                $("#module-photo-gallery").find("#module-last-card").fadeOut("fast");
                return false;
            });

            if ($("#module-photo-gallery").find("#show-inter").length > 0 && $("#module-photo-gallery-ad").length > 0 && !DAILYCANDY.ads.isBlank("#module-photo-gallery-ad")) {
                $("#module-photo-gallery").find("#show-inter").one("click", function() {
                    $("#module-photo-gallery-ad").show();
                    $("#module-photo-gallery").find("#image").hide();
                    $("#module-photo-gallery").find("#image-copy").hide();
                    return false;
                });
            }
        },
        dropDown: function() {
            $(".drop-down").toggle(function() {
                if ($(this).siblings().length === 0) {
                    $(this).parent().addClass("active").siblings().show();
                } else {
                    $(this).siblings().show();
                }
            }, function() {
                if ($(this).siblings().length === 0) {
                    $(this).parent().removeClass("active").siblings().hide();
                } else {
                    $(this).siblings().hide();
                }
            });
        },
        shareBox: function() {
            $(".see-all").each(function() {
                var articleTitle = $(this).attr("title");
                var articleURL = $(this).attr("name");

                $(this).attr("title", "");
                $(this).attr("name", "");
                
                var share_html = '<div class="share-box">' +
                    '<ul class="network-icons">';
                    if ( $(this).hasClass('fb_twt_su') ) {
                        share_html  += '<li><a class="facebook" target="_blank" href="http://www.facebook.com/share.php?u=' +
                            articleURL +
                            '"><span>&nbsp;<\/span>Facebook</a></li>' +
                        '<li><a class="twitter" target="_blank" href="http://twitter.com/intent/tweet?via=dailycandy&text=' +
                            articleTitle +
                            '&url=' +
                            articleURL +
                            '"><span>&nbsp;<\/span>Twitter</a></li>' +
                            '<li><span class="tumblr_button_abc123"><\/span><\/li>';
                        }
                        
                        share_html  += '<li><a class="stumbleupon" href="http:\/\/www.stumbleupon.com\/submit?url=' +
    					articleURL +
    					'" target="_blank"><span>&nbsp;<\/span>Stumbleupon<\/a><\/li>' +
                        '<li><a class="delicious" href="http://del.icio.us/post?url=' +
                            articleURL +
                            '&amp;title=' +
                            articleTitle +
                            '" target="_blank"><span>&nbsp;<\/span>del.i.cio.us</a></li>' +
                        '<li><a class="digg" href="http://digg.com/submit?phase=2&amp;url=' +
                            articleURL +
                            '&amp;title=' +
                            articleTitle +
                            '" target="_blank"><span>&nbsp;<\/span>Digg</a></li>' +
                        '<li><a class="myspace" href="http://www.myspace.com/Modules/PostTo/Pages/?l=3&amp;u=' +
                            articleURL +
                            '&amp;t=' +
                            articleTitle +
                            '" target="_blank"><span>&nbsp;<\/span>MySpace</a></li>' +
                        '<li><a class="reddit" href="http://reddit.com/submit?url=' +
                            articleURL +
                            '&amp;title=' +
                            articleTitle +
                            '" target="_blank"><span>&nbsp;<\/span>Reddit</a></li>' +
                        '<li><a class="technorati"    href="http://www.technorati.com/faves?add=' +
                            articleURL +
                            '" target="_blank"><span>&nbsp;<\/span>Technorati</a></li>' +                       
                        '<li><a class="blogger" href="javascript:popw=\'\';Q=\'\';x=document;y=window;if(x.selection)%20{Q=x.selection.createRange().text;}%20else%20if%20(y.getSelection)%20{Q=y.getSelection();}%20else%20if%20(x.getSelection)%20{Q=x.getSelection();}popw%20=%20y.open(\'http://www.blogger.com/blog_this.pyra?t=\'%20+%20escape(Q)%20+%20\'&amp;u=\'%20+%20escape(\'' +
                            articleURL +
                            '\')%20+%20\'&amp;n=\'%20+%20escape(\'' +
                            articleTitle +
                            '\'),\'bloggerForm\',\'scrollbars=no,width=475,height=300,top=175,left=75,status=yes,resizable=yes\');if%20(!document.all)%20T%20=%20setTimeout(\'popw.focus()\',50);void(0);"><span>&nbsp;<\/span>Blogger</a></li>' +
                        '<li><a class="yahoo_buzz"    href="http://buzz.yahoo.com/submit?submitUrl=' +
                            articleURL +
                            '&amp;submitHeadline=' +
                            articleTitle +
                            '" target="_blank"><span>&nbsp;<\/span>Yahoo!<br\/> Buzz</a></li>' +    
                        '<li><a class="google_bmarks" href="http://www.google.com/bookmarks/mark?op=edit&amp;bkmk=' +
                            articleURL +
                            '&amp;title=' +
                            articleTitle +
                            '" target="_blank"><span>&nbsp;<\/span>Google<br\/> Bookmarks</a></li>' +
                        '<li><a class="yahoo_bmarks"  href="http://bookmarks.yahoo.com/toolbar/savebm?opener=tb&amp;u=' +
                            articleURL +
                            '&amp;t=' +
                            articleTitle +
                            '" target="_blank"><span>&nbsp;<\/span>Yahoo!<br\/> Bookmarks</a></li>' +
                    '</ul>' +
                '</div>';
                
                $(this).append( share_html );
            });
        },
        searchGo: function(){
            $("#module-header").find("form#module-search-dc").submit(function() {
                var query = $("input.search-query");

                if (query.val() == "Search DailyCandy") {
                    query.val("");
                }
            });
        },
        autocompleteSearch: function() {
            $("#module-search").find("input.search-query").autocomplete("/rest/search/autocomplete", {
                minChars: 3,
                width: 232,
                matchSubset: 1,
                autoFill: false,
                selectFirst: false,
                formatItem: function(row, i, max) {
                    return "<div>" + row[0] + "<div class='autoDimension'>" + row[1] + "</div></div>";
                }
            });
        },
        action: function() {
            /* Send to a friend */
            $("#module-article-tools a.email, #module-dossier-tools a.email, #module-video-tools a.email, #module-account-lists a.email, #module-flipbook-content a.email, #module-flipbook-end-share a.email").fancybox({
                'overlayShow': true,
                'padding': 0,
                'width': 505,
                'height': 580,
                'hideOnContentClick': false,
                'centerOnScroll': false,
                'zoomSpeedIn': 300,
                'zoomSpeedOut': 300,
                'type': 'iframe'
            });

            $("#module-article-tools a.print, #module-dossier-tools a.print").click(function() {
                window.print();
                return false;
            });

            var results = new RegExp('[?&]action=([^&#]*)').exec(window.location.href);
                        
            var fromDc = (!!(document.referrer) && document.referrer.match(window.location.host) !== null);
            
            if (!fromDc && results !== null && results[1] == 'send') {
                $("#module-article-tools a.email, #module-dossier-tools a.email, #module-flipbook-content a.email, #module-video-tools a.email").click();
            }

            else if (!fromDc && results !== null && results[1] == 'print') {
                $("#module-article-tools a.print, #module-dossier-tools a.print").click();
            }

            else if (!fromDc && results !== null && results[1] == 'save') {
                $("#module-article-tools a.save, #module-dossier-tools a.save, #module-flipbook-content a.save").click();
            }
        },
        checkViewed: function( what, id ) {
            // cookie should store a value like local-list-home|yes
            // "what":  the string to the left of the | ... e.g. local-list-home
            // "id":    the ID of the element to show if this feature has not yet been viewed
            var viewed = [];
            if ( $.cookie("viewed") ) viewed = $.cookie("viewed").split(",");
            if ( viewed.length > 0 ) {
                for (var i=0,j=viewed.length;i<j;i++) {
                    if ( viewed[i].indexOf(what) != -1 ) {
                        if ( viewed[i].split('|')[1] != "yes" ) {
                            $('#'+id).slideDown(400);
                        }
                    }
                }
            } else {
                $('#'+id).slideDown(400);
            }
        },
        markViewed: function( what, val ) {
            // this function will add the string "{what}|{val}" to the cookie, "viewed"
            // it will check for an existing instance of {what} in the cookie and remove that before adding the new value
            var viewed = [];
            if ( $.cookie("viewed") ) viewed = $.cookie("viewed").split(",");
            
            if ( viewed.length > 0 ) {
                for (var i=0,j=viewed.length;i<j;i++) {
                    if ( viewed[i].indexOf(what) != -1 ) {
                        viewed.splice(i,1);
                    }
                }
            }
            var new_viewed = what + "|" + val;
            if ( viewed.length > 0 ) new_viewed += "," + viewed.join(",");
            
            $.cookie("viewed", new_viewed);
        },
        getHashValue: function( key ) {
            var hash = window.location.hash;
            if ( hash.length > 0 ) {
                var pairs = hash.split('#');

                for ( var i in pairs ) {
                    if ( !isNaN( parseInt(pairs[i]) ) ) {
                        return parseInt(pairs[i]);
                    } else if ( key == pairs[i].split('=')[0] ) {
                        // remove any &.... and ?... data.  why?  for a hash value, we don't expect nor want querystring key/value pairs.
                        // it's a bit blunt, but works.
                        var value = pairs[i].split('=');
                        if ( value.length > 1 ) {
                            value[1] = value[1].split('?')[0].split('&')[0];
                            return value[1];
                        } else {
                            // if there's a key but no value, return empty string so we at least knew if the key was present.
                            // lets us distinguish between a key not being present (return false) or presents sans value (return "")
                            // this is called premature optimization.  
                            return "";
                        }
                        
                    }
                }
                // if we got here, we hadn't returned a value, meaning a slide number wasn't explicitly set in the hash even though one was requested
                // so, return 0 rather than not returning anything, because a getHashValue('slide') expects an integer in response
                if ( key == "slide" ) return 0;
                return false;
            }
        }
    },
    homepageCarousel: function() {
        if (typeof products != "undefined") {
            var buttons = [];
            var divslidecontrols = $('#slides-controls');

            var ulslideitems = $('#slide-items');
            ulslideitems.empty();

            var subtitle = "";

            for (var i = 0, jj = products.length; i < jj; i++) {
                subtitle = products[i].type;

                if(subtitle == "Gallery") {
                    subtitle = "Photo Gallery";
                }else if(subtitle == "DealsEmail") {
                    subtitle = "Deals";
                }else {
                    subtitle = products[i].subtitle;
                }

                var target = "";
                if (typeof products[i].target != 'undefined') {
                    target = ' target="' + products[i].target + '"';
                }
                
                ulslideitems.append(
                    "<li><a href='" + products[i].url + "'" + target + "><img src='" + products[i].img + "' alt='" + products[i].title + "' width='380' height='285' /></a>" +
                        "<span class='box'>" +
                            "<h1><a href='" + products[i].url + "'>" + products[i].title + "</a></h1>" +
                            "<h2>" + subtitle + "</h2>" +
                            "<p>"+products[i].summary+"</p>"+
                        "</span>"+
                    "<\/li>");
            }

            $('#slide-items').cycle({
                fx:     'scrollHorz', 
                timeout: 5000,
                speed:  800,
                easing:  'easeInOutQuint',
                pager:  '.slides-control',
                next: '.next',
                prev: '.prev',
                activePagerClass: 'active',
                cleartype: !$.support.opacity
            });

        }
    },
    onestepsignup: function() {
        var $editions = $("#module-signup-sidebar").find("#hidden-editions");

        $("#module-signup-sidebar").find("input.email").focus(function() {
            if ($editions.css('display') == "none") {
                $editions.slideDown("fast");
            }
        });

        $("#module-signup-sidebar a.see-more").click(function() {
            if ($editions.css('display') == "none") {
                $editions.slideDown("fast");
                $(this).addClass('active');
                return false;
            } else {
                $editions.slideUp();
                $(this).removeClass('active');
                return false;
            }
        });
    },
    account: {
        init: function() {
            $("div#module-account-activity dl").mouseover(function() {
                $(this).addClass("active");
                $("a.delete", this).show();
            }).mouseout(function() {
                $(this).removeClass("active");
                $("a.delete", this).hide();
            });
            
            $("div#module-account-lists dl").mouseover(function() {
                $(this).addClass("active");
                $("a.delete", this).show();
            }).mouseout(function() {
                $(this).removeClass("active");
                $("a.delete", this).hide();
            });

            $("a.pause-subscriptions").click(function() {
                $(this).toggleClass('on');
                $("#module-pause-subscriptions").slideToggle('fast');
                return false;
            });

            var ew = $('ul#local-editions li #ew');
            var local7 = $('ul#local-editions li .local7');

            local7.each(function() {
                $(this).click(function() {
                    if ($(this).is(':checked')) {
                        ew.attr('checked', true);
                    }
                });
            });

            //check swirl cookie
            var email =  $("div#module-account-settings input#email").val();
            
            var checkSwirlCookie = $.cookie("subscribed-swirl");
            
            if (checkSwirlCookie == null) {
            
                if (email) {
                    if (DAILYCANDY.subscriber.checkSubscribedToSwirl(email))
                        $('input#swirl').attr('checked', true);
                    else if ($("div#module-account-subscribe ul.errors").length != 0)
                        $('input#swirl').attr('checked', true); //error on form submit
                }
                else if ($("div#module-account-settings input").length != 0){
                    //on the create account page but email not pre-entered
                    $('input#swirl').attr('checked', true);
                }
                else{
                    //for unsubscribe page
                    email =  $("p#email strong").text();
                    if (email) {
                        if (DAILYCANDY.subscriber.checkSubscribedToSwirl(email)){
                            $('input#swirl').attr('checked', true);
                        }
                    }
                }
            }
            else {
                if (checkSwirlCookie == 'true')
                    $('input#swirl').attr('checked', true);
            }
            
        }
    },
    video: {
        init: function(){
                var articleHeight = $("#video-article-content").css('height','auto').height();
                $("#video-article-content").css('height',84);
                
                $("#video-article-see-all").click(function(){
                    var link = $(this);
                    if($("#video-article-content").height() == 84) {
                        $("#video-article-content").animate({ height: articleHeight}, '100000', function(){link.find("em").text("Collapse the Article").end().addClass("up");});
                    }else{
                        $("#video-article-content").animate({height: 84}, '100000', function(){link.find("em").text("Read the Full Article").end().removeClass("up");});
                    }
                    return false;
                });
            
            this.pagination();
            this.channels();
            this.playlist();
            this.videoNext();
                
        },
        pagination: function() {
        	var $pageLinks = $('#module-video-gallery #module-page-nav a, #paginationNextLink');
        		
        	$pageLinks.live('click',function(){

                var pattern = new RegExp("http:\/\/[a-zA-Z0-9\\.:]*\/");
                var url = $(this).attr('href');

                if (pattern.exec(url) !== null) {
                    url = url.replace(pattern.exec(url),'/');
                }

                $.ajax({
                    url: '/channel' + url,
                    beforeSend: function() {
                        $('#gallery').addClass("loading");
                        $('#module-video-gallery').append('<div class="share-progress"><img src="/i/gfx/loading.gif" alt="" /></div>');
                    },              
                    complete: function() {
                        $('#gallery').removeClass("loading");
                        $('.share-progress').remove();
                    },
                    success: function(data){
                        $("#module-video-gallery #gallery").html(data);
                    }
                });

                return false;
            });
        },
        channels: function() {
            $('#module-video-gallery-menu a').live('click',function(){
                var section = $(this);
                var cookie = "";
                if ($.cookie('dcVideoPlaylist') !== null) {
                    cookie = $.cookie('dcVideoPlaylist');
                } else {
                    if($(this).parents().attr('id') == 'playlistlink') {
                        $(this).html('MY PLAYLIST (0)');
                    }
                }
                $.ajax({
                    url: '/channel' + $(this).attr('href'),
                    data: 'dcVideoPlaylist=' +  cookie,
                    beforeSend: function() {
                        $('#gallery').addClass("loading");
                        $('#module-video-gallery').append('<div class="share-progress"><img src="/i/gfx/loading.gif" alt="" /></div>');
                    },              
                    complete: function() {
                        $('#gallery').removeClass("loading");
                        $('.share-progress').remove();
                    },              
                    success: function(data){
                        $('#module-video-gallery-menu ul li').each(function(){
                            $(this).removeClass('active');
                        });
                        var selected = $(section).parent();
                        $(selected).addClass('active');
                        
                        $('#gallery').html(data);
                    }
                });
                return false;
            });
        },
        playlist: function(){
            var playlist = [];
            var cookie = "";
            if ($.cookie('dcVideoPlaylist') !== null) {
                cookie = $.cookie('dcVideoPlaylist');
                playlist = cookie.split(',');
            }           
            
            function addToPlaylist(id) {
                playlist.push(id);
                $.cookie('dcVideoPlaylist',playlist.toString(),{expires: 365, path: '/'});
                $('#module-video-gallery-menu #playlistlink a').html('MY PLAYLIST ('+ playlist.length +')');
                    
                if($('#module-video-gallery-menu ul li.active').attr('id') == 'playlistlink') {
                    $.ajax({
                        url: '/channel' + window.location.pathname + '?playlist',
                        data: 'dcVideoPlaylist=' +  playlist,
                        success: function(data) { $('#gallery').html(data); }
                    });
                }   

                if ($('#module-video-tools a.playlist').attr('id') == id ) {
                    $('#module-video-tools a.playlist').addClass('inplaylist').removeClass('playlist').text('REMOVE FROM PLAYLIST');
                }

                $('button[id=' + id + ']').parent().addClass('playlist-thumbnail').removeClass('gallery-thumbnail');
            }

            function removeFromPlaylist(id){
                if(cookie !== null) {
                    playlist = $.unique(playlist);
                    playlist = $.grep(playlist, function(val) { return val != id; });
                                            
                    if ($('#module-video-tools a.inplaylist').attr('id') == id ) {
                        $('#module-video-tools a.inplaylist').addClass('playlist').removeClass('inplaylist').text('MY PLAYLIST');
                    }

                    if (playlist.length > 0) {
                        $('#module-video-gallery-menu #playlistlink a').html('MY PLAYLIST ('+ playlist.length +')');
                        $.cookie('dcVideoPlaylist',playlist.toString(),{expires: 365, path: '/'});
                    } else {
                        $.cookie('dcVideoPlaylist',null,{expires: -1, path: '/'});
                        $('#module-video-gallery-menu #playlistlink a').html('MY PLAYLIST (0)');
                        playlist = [];
                    }

                    if ($('#module-video-gallery-menu ul li.active').attr('id') == 'playlistlink') {
                        $.ajax({
                            url: '/channel' + window.location.pathname + '?playlist',
                            data: 'dcVideoPlaylist=' +  playlist,
                            success: function(data) { $('#gallery').html(data);}
                        });
                    }   

                    $('#module-video-next h6:contains("MY PLAYLIST")~div li button[id=' + id + ']').parents('li').remove();
                    $('button[id=' + id + ']').parent().addClass('gallery-thumbnail').removeClass('playlist-thumbnail');
                    
                }   
            }

        $('#module-video-gallery #gallery button, #module-video-next button, #module-video-tools a.playlist, #module-video-tools a.inplaylist').live('click',function(){

            if ($(this).hasClass('playlist-add')) {
                addToPlaylist($(this).attr("id"));
            } else if ($(this).hasClass('playlist-remove')) {
                removeFromPlaylist($(this).attr("id"));
            }

            if ($(this).hasClass('playlist')) {
                addToPlaylist($(this).attr("id"));
            } else if ($(this).hasClass('inplaylist')) {
                removeFromPlaylist($(this).attr("id"));
            }

            return false;
        }); 
    },
        videoNext: function(){
        
        	
            if ($('#video-next-carousel').length > 0) {
                var slidesNum = $('#video-next-carousel li').length;
                if(slidesNum > 2) {
                    $('#module-video-next a.next').removeClass('disabled');
                }
                function onAfter(curr,next,opts) {
                    var next = $('#module-video-next a.next');
                    var prev = $('#module-video-next a.prev');
                    opts.currSlide == slidesNum - 1 ? next.addClass('disabled') : next.removeClass('disabled');
                    opts.currSlide == 0 ? prev.addClass('disabled') : prev.removeClass('disabled');
                }
                $('#video-next-carousel').cycle({ 
                    fx:'scrollVertUp', 
                    timeout:0,
                    speed:400,
                    easing:'easeInOutQuint',
                    pager:'#slides-control',
                    next:'#module-video-next .next',
                    prev:'#module-video-next .prev',
                    nowrap:1,
                    activePagerClass:'active',
                    cleartype: !$.support.opacity,
                    after: onAfter
                });

                $('#video-next-carousel').css('visibility','visible');
            }
        }
    },
    misc: {
        comcastbar: function() {
            var results = new RegExp('[?&]cmbar=([^&#]*)').exec(window.location.href);

            if (results !== null && results[1] == '1') {
                $.cookie('cmbar', '1', {
                    path: '/'
                });
            }
            if ($.cookie('cmbar') == '1') {
                document.write('<div style="clear:both;width:100%;"><iframe src="http://xfinity.comcast.net/header/vendor/dailycandy/" width="100%" height="22" scrolling="no" frameborder="0" border="0"></iframe></div>');
            }
        }
    },
    ads: {
        hideBlank: function(divId) {
            if (DAILYCANDY.ads.isBlank(divId)) {
                $(divId).hide();
            }
        },
        isBlank: function(divId) {
            return (/\/viewad\/817-grey\.gif/.test($(divId + " a img").attr("src")));
        }
    },
    subscriber: {
            checkSubscribedToSwirl: function(email){
            if (email === null || email == "") {
                return false;
            }
            else{
                //call SWIRL API
                var retValue = false;
                var url = "/rest/subscriber/" + email + "/swirl/";
                $.ajax({
                      async: false,
                      url: url,
                      dataType: 'json',
                      success: function (data){
                        if ((data != null) && (data.valid == true) && (data.subscribed == true))
                                retValue = true;
                        }
                    });

                return retValue;
                
            }
        },  
        validate: function(email, editions, options){
            if (email === null || email == "") {
                options.invalid([{
                    field: "email",
                    message: "no email address"
                }], []);
                return false;
            }

            return true;
        },
        doUpdate: function(email, editions, type, options) {
            // TODO include session cookie

            var url, method;

            if (type == "create") {
                url = "/rest/subscriber/" + email; // XXX urlencode
                method = "PUT";
            } else {
                if (type == "addSubscriptions") {
                    url = "/rest/subscriber/" + email + "/subscriptions"; // XXX urlencode
                    method = "PUT";
                }
            }

            $.ajax({
                data: editions,
                cache: false,
                url: url,
                dataType: 'json',
                type: method,
                timeout: 20000,
                error: options.error ||
                function(){
                },
                beforeSend: function(xhr){
                    xhr.setRequestHeader("X-HTTP-Method-Override", method);
                    options.beforeSend && options.beforeSend(xhr);
                },
                success: function(json){
                    if (json.valid == 'true') {
                        
                        if (json.variables != null){
                            for (var i=0; i< json.variables.length; i++) {
                                var map = json.variables[i];

                                if ((map['swirl']) && (map['swirl'] == true)){
                                    $.cookie("subscribed-swirl", "true", {path: '/'});
                                    break;
                                }
                            }
                        }
                        
                        options.valid(json);
                    } else {
                        options.invalid(json.errors, json.globalErrors);
                    }
                }
            });
        },
        create: function(email, editions, options){
            if (!this.validate(email, editions, options)) {
                return;
            }

            this.doUpdate(email, editions, "create", options);
        },
        addSubscriptions: function(email, editions, options){
            if (!this.validate(email, editions, options)) {
                return;
            }

            this.doUpdate(email, editions, "addSubscriptions", options);
        }
    },
    lists: {
        addListing: function(subscriberId, itemId, itemTitle, listId, listTitle){

            var lists = {
                subscriberId    :   subscriberId,
                contentListId   :   listId,
                linkedContentId :   itemId
            };
            if (!itemTitle) itemTitle = "";
            if (!listTitle) listTitle = "Your new Local List";

            $.cookie("last_list", listId, { path: '/' });

            $.ajax({
                type: 'POST',
                url: '/rest/subscriber/contentlist/linkedcontent',
                data: lists,
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                    alert('There was a problem adding selected listing to your List.');
                },      
                success: function(data, textStatus, XMLHttpRequest){
                    var callingLink = $("#item-"+itemId);
                    if (callingLink.length != 0) {
                        callingLink.text('Added!');
                        callingLink.removeAttr('onclick');
                        callingLink.addClass('completed');
                    }

                    // if this is the modal
                    if ($("#num_items").length > 0) {

                        $("#num_items").parent().show();
                        var num_items = parseInt($("#num_items").text()) + 1;
                        var items = (num_items == 1) ? " item" : " items";
                        $('#num_items').text(String(num_items) + items);
                        $('#itinerary-stats button').unbind();
                        $('#itinerary-stats button').click( function() { parent.location.reload(true); });
                        
                        DAILYCANDY.lists.modifyModalSearchLinks(num_items);
                    } else {
                        $("#create, #name").hide();
                        $("#complete").fadeIn();
                        $("#complete").html("You added <strong>"+ itemTitle +"</strong> to:<br><a target='_top' href='/account/"+subscriberId+"/local-list/"+listId+"'>"+ listTitle +"</a>  <div id='be-patient'>(It may take just a few minutes before others can view it.)</div>");

                        var p_url = parent.window.location.pathname;
                        var i_url = "/account/"+subscriberId+"/local-list/"+listId;
                        if (p_url==i_url) { parent.document.getElementById('fancybox-close').style.display = 'none'; }

                        parent.document.getElementById('fancybox-frame').setAttribute('item', itemId);
                    }
                }
            });

        },
        modifyModalSearchLinks: function(num_items) {
            if (num_items && num_items > 0) {
                $('#sort a, a.searchLink, div.page-numbers a, .next a, .prev a').each( function() {
                    
                    var current_href = $(this).attr('href');
                    if (current_href.indexOf('num_items') != -1) {
                        var current_href_parts = current_href.split("num_items");
                        current_href_parts[1] = (current_href_parts[1].indexOf('&') != -1) ? current_href_parts[1].substr(current_href_parts[1].indexOf('&')+1):"";
                        var new_url = current_href_parts[0] + current_href_parts[1] + "num_items=" + String(num_items);
                    } else {
                        var new_url = current_href + "&num_items=" + String(num_items);
                    }
                    $(this).attr('href',  new_url);
                });
            }
        },
        createList: function( listTitle, subscriberId, itemId ){
            var lists = {
                title           :   listTitle,
                subscriberId    :   subscriberId
            };
            
            $.ajax({
                type: 'POST',
                url: '/rest/subscriber/contentlist',
                data: lists,
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                    alert("There was a problem creating your List");
                },      
                success: function(data, textStatus, XMLHttpRequest){
                    if (!itemId) {
                        $('#create').hide();
                        $('#name').hide();
                        $('#complete p').html( 'You\'ve created the Local List, <strong>' + listTitle + '</strong>.  <a target="_top" href="/account/'+subscriberId+'/local-list/'+data.variables[0].contentListId+'">Go view it.</a>' );
                        $('#complete').show();
                        $.cookie("last_list", data.variables[0].contentListId, { path: '/' });
                        parent.document.getElementById('fancybox-close').style.display = 'none';
                    } else {
                        DAILYCANDY.lists.addListing(subscriberId, itemId, "", data.variables[0].contentListId, "");
                    }
                }
            });
        },
        initListModal: function(subscriberId, itemId, itemTitle, newList){
            var data = { subscriberId : subscriberId };
            if (newList == "") {
                //populate select with existing lists
                $.ajax({
                    type: 'GET',
                    url: '/rest/subscriber/contentlist',
                    dataType: "json",
                    data: data,
                    error: function(XMLHttpRequest, textStatus, errorThrown) {
                        alert('There was a problem loading your List');
                    },
                    success: function(data, textStatus, XMLHttpRequest){
                        var output = [];
                        for(var i=0, jj = data.variables[0].contentLists.length;  i < jj; i++) {
                            output.push('<option value="'+  
                                            data.variables[0].contentLists[i].contentListId +'" title="'+
                                            data.variables[0].contentLists[i].contentListTitle +'">'+
                                            data.variables[0].contentLists[i].contentListTitle +
                                        '</option>');
                        }
                        output.push('<option value="">Create a new List &rarr;</option>');

                        $("#my-lists").html(output.join(''));

                        var last_list = ( $.cookie("last_list") !== null ) ? $.cookie("last_list"):0;
                        $("#my-lists").val(last_list);
                    }
                });

                //select existing list or create a new one
                $("#new-list").bind('click', {itemId:itemId, itemTitle:itemTitle}, function(event) {
                    var list = $("#my-lists");
                    var listId = list.val();
                    var listTitle = $(list+":selected").text();

                    if(listId == "") {
                        $("#create").hide();
                        $("#name").fadeIn();
                        $("#list-name").val("");
                    } else {
                        DAILYCANDY.lists.addListing(subscriberId, event.data.itemId, event.data.itemTitle, listId, listTitle);
                    }
                });
                
                // "GO" button on new list form
                $('#new-list-name').click( function() {
                    var listTitle = $("#list-name").val();
                    if (listTitle.length > 1) DAILYCANDY.lists.createList( listTitle, subscriberId, itemId );
                });
            } else {
                $('#create').hide();
                $('#complete').hide();
                $('#name').show();
                $('#new-list-name').click( function() {
                    var listTitle = $("#list-name").val();
                    if ( listTitle.length > 1 ) DAILYCANDY.lists.createList( listTitle, subscriberId );
                });
            }
        },
        lengthCheck: function() {
            if ( $('#list-items li.local-list-item').length >= 99 ) {
                $('#warnings').html( '<h2>This Local List has the maximum number of businesses!</h2>Please remove some if you would like to add more.' );
                $('#warnings').show();
                $('.controls').hide();
            } else {
                $('#warnings').hide();
                $('.controls').show();
            }
        },
        modalCreateList: function(subscriberId){
            $.fancybox({
                'href'          : "/modal/lists.jsp?newList=newList&subscriberId="+subscriberId,
                'width'         : 380,
                'height'        : 100,
                'autoScale'     : false,
                'transitionIn'  : 'none',
                'transitionOut' : 'none',
                'type'          : 'iframe',
                'centerOnScroll': 'true',
                'scrolling'     : 'no',
                'titleShow'     : false,
                'hideOnOverlayClick'    : false
            });
        },
        reorderList: function(subscriberId, contentListId, linkedContentOrder){
            $.ajax({
                type: 'POST',
                url: '/rest/subscriber/contentlist/reorder',
                data: "subscriberId="+subscriberId+"&contentListId="+contentListId+"&linkedContentOrder="+linkedContentOrder,
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                    alert('There was a problem ordering your List');
                },
                success: function(data, textStatus, XMLHttpRequest){
                    poi.init($("#list-items").sortable('toArray'));
                }
            });
        },
        removeList: function(subscriberId, contentListId){
            var deleteList = confirm("Are you sure you want to delete this Local List? It will be gone forever!");
            if (deleteList) {
                var lists = {
                    subscriberId : subscriberId,
                    contentListId : contentListId
                }
                $.ajax({
                    type: 'DELETE',
                    url: '/rest/subscriber/contentlist/',
                    data: lists,
                    error: function(XMLHttpRequest, textStatus, errorThrown) {
                        alert('There was a problem deleting your List');
                    },      
                    success: function(data, textStatus, XMLHttpRequest){
                        if ($('#list-title-'+contentListId).length > 0) {
                            $('#list-title-'+contentListId).parent().fadeOut( function() { $(this).remove(); });
                            $('#list-title-'+contentListId).parent().prev('.hr').fadeOut( function() { $(this).remove(); });
                        } else {
                            window.location = "/account/guides.jsp";
                        }
                    }
                });
            } else {
                return;
            }
        },
        removeListing: function(subscriberId, itemId, listId){
            var lists = {
                subscriberId : subscriberId,
                contentListId : listId,
                subscriberLinkedContentId : itemId
            };
            $.ajax({
                type: 'DELETE',
                url: '/rest/subscriber/contentlist/linkedcontent',
                data: lists,
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                    alert("There was a problem deleting this business.");
                },      
                success: function(data, textStatus, XMLHttpRequest){
                    var reordered = $("#list-items").sortable('toArray');
                    
                    var removedItemIndex = jQuery.inArray(itemId.toString(), reordered);
                    
                    $('#'+itemId).fadeOut(200, function() { 
                        $(this).remove(); 
                    });

                    reordered.splice(removedItemIndex,1);
                    poi.init(reordered);

                    DAILYCANDY.lists.lengthCheck();
                }
            });

        },
        startAdding: function(itemId, itemTitle, guideId, subscriberId) {
            if (itemId == 0) {}
            if (itemTitle == "") {}
            if (guideId == 0) {
                $.fancybox({
                    'href'          : "/modal/lists.jsp?subscriberId="+subscriberId+"&itemId="+itemId+"&itemTitle="+itemTitle,
                    'width'         : 400,
                    'height'        : 100,
                    'autoScale'     : false,
                    'transitionIn'  : 'none',
                    'transitionOut' : 'none',
                    'type'          : 'iframe',
                    'centerOnScroll': 'true',
                    'hideOnOverlayClick'    : false,
                    'scrolling'     : 'no',
                    'titleShow'     : false,
                    'onCleanup'     : function() {
                                    // see if the iframe had a custom element, item, added
                                    // that is done in the addListing success function
                                    // and is how we tell the window containing an iframe that an item was successfully added
                                    // so that here, we can set the link in the parent to say "Added!"
                                    var iframe = document.getElementById('fancybox-frame');
                                    var itemId = iframe.getAttribute('item');
                                    if (itemId) {
                                        var callingLink = $('#item-'+itemId);
                                        if (callingLink.length != 0) {
                                            callingLink.text('Added!');
                                            callingLink.removeAttr('onclick');
                                            callingLink.addClass('completed');
                                        }
                                    }
                                }
                });
            } else {
                var listTitle = "";
                DAILYCANDY.lists.addListing(subscriberId, itemId, itemTitle, guideId, listTitle);
            }
        },
        toggleEdit: function(which) {
            if (!which) which = "show";
            if (which == "show") {
                $('#module-local-lists-summary .view-mode').hide(0);
                $('#module-local-lists-summary .edit-mode').show(0);
                $('#edit_title').val( $('#list_title').text() );
                $('#edit_description').val( $('#list_description').text() );
                $('#share-tools').hide(0);
            } else {
                $('#module-local-lists-summary .view-mode').show(0);
                $('#module-local-lists-summary .edit-mode').hide(0);
                $('#share-tools').show(0);
            }
        },
        updateList: function(contentListId) {

            var title = $('#edit_title').val();
            var description = $('#edit_description').val();
            
            var update_list = {
                subscriberId : s.prop14,
                contentListId : contentListId,
                title : title,
                description : description
            }
            
            $.ajax({
                type: 'POST',
                url: '/rest/subscriber/contentlist',
                data: update_list,
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                    alert("There was a problem saving your changes.");
                },      
                success: function(data, textStatus, XMLHttpRequest){

                    $('#edit_title').val(title);
                    $('#list_title').text(title);
                    
                    $('#edit_description').val(description);
                    $('#list_description').text(description);
                    
                    DAILYCANDY.lists.toggleEdit('hide');
                }
            });
        }
    },
    bookmarks: {
        save: function(contentId, subscriberEmail) {
            $.ajax({
                url: "/rest/favorites/" + subscriberEmail,
                type: "post",
                data: {"contentId" : contentId },
                complete: function(response) {
                    if (response.error) {
                        alert("There was a problem saving this item to your favorites. Error was" + response.error);
                        $(this).html('BOOKMARK');
                    } else {
                        $('li.favorite-li').each( function() {
                            $(this).addClass('saved').html('SAVED');
                        });
                    }
                }
            });
        }
    },
    fashionWeek: {
            carousel: function() {
                if (typeof products != "undefined") {
                    var buttons = [];
                    var divslidecontrols = $('#slides-controls');
        
                    var ulslideitems = $('#slide-items');
                    ulslideitems.empty();
        
                    var subtitle = "";
        
                    for (var i = 0, jj = products.length; i < jj; i++) {
                        subtitle = products[i].type;

                        if(subtitle == "Gallery") {
                            subtitle = "Photo Gallery";
                        }else if(subtitle == "DealsEmail") {
                            subtitle = "Deals";
                        }else {
                            subtitle = products[i].subtitle;
                        }

                        var target = "";
                        if (typeof products[i].target != 'undefined') {
                            target = ' target="' + products[i].target + '"';
                        }
                        
                        ulslideitems.append(
                            "<li><a href='" + products[i].url + "'" + target + "><img src='" + products[i].img + "' alt='" + products[i].title + "' width='380' height='285' /></a>" +
                                "<span class='box'>" +
                                    "<h3>" + products[i].date + "</h3>" +
                                    "<h1><a href='" + products[i].url + "'>" + products[i].title + "</a></h1>" +
                                    "<h2>" + subtitle + "</h2>" +
                                    "<p>"+products[i].summary+"</p>"+
                                "</span>"+
                            "<\/li>");
                    }

                    $('#slide-items').cycle({ 
                        fx:     'scrollHorz', 
                        timeout: 5000,
                        speed:  800,
                        easing:  'easeInOutQuint',
                        pager:  '.slides-control',
                        next: '.next',
                        prev: '.prev',
                        activePagerClass: 'active',
                        cleartype: !$.support.opacity
                    });
                    
                    $('div.slides-control a').each( function() {
                        if ( $(this).text().length == 2 ) $(this).addClass('double-digit');
                    });

                }
            }
        },
    flipbook: function (args){
        if (typeof slides != "undefined") {
            var slideItems = $('#module-flipbook');
            slideItems.empty();
            var slideCredit = "";
            for (var i = 0, jj = slides.length; i < jj; i++) {
            
                if(slides[i].credit != "No Credit") {
                    slideCredit = "Photo: "+ slides[i].credit;
                } else {
                    slideCredit = ""
                }
                
                slideItems.append("<div>"+
                    "<div class='slideImg'><img src='" + slides[i].img + "' alt='" + slides[i].title + "' height='345' /><div class='slideCredit'>"+ slideCredit + "</div><\/div>" + 
                        "<div class='slideCopy'><h2>" + slides[i].title + "</h2>" +
                            "<div id='slideDesc"+i+"'></div>" +
                        "<\/div>"+
                    "<\/div>");
                    $("#slideDesc"+i).html($("#slideContent"+i).html());

                    if (typeof args.backlink != "undefined") {
                    switch (args.backlink) {
                        case "fall-2011":
                            $("#slideDesc"+i).append( '<div id="module-back-to"><a href="/all-cities/fashion-week/fall-2011/"><img src="/i/fashionweek-2011/back-to-fashion-week-2011.gif" alt="Back to Fashion Week: Fall 2011 Coverage" /></a></div>' );
                            break;
                    }
                }

            }
            var prevSlide   = null,
            trackQueue  = [];
            //skipSlideSlideTracking    = false,

            function trackSlides() {
                var current = null;
                while(trackQueue.length > 0) {
                    current = trackQueue.shift();
                    s.pageName = current;
                    s.t();
                }
            }

            function refreshFrame(srcId) {
                var adUrl = $(srcId).attr('src');
                if(typeof adUrl != 'undefined') {
                    var cb = '&cb=',
                    ts = new Date().getTime(),
                    lastIdx = adUrl.lastIndexOf(cb),
                    ordRx = /ord=(\d+)\?/,
                    regOrd = adUrl.match(ordRx),
                    newOrd = parseInt(regOrd[1])+1;
                    adOrd = newOrd; // adOrd defined in flipbook template
                    
                    if(lastIdx > -1) {
                        adUrl = adUrl.substring(0,lastIdx);
                    }

                    adUrl = adUrl.replace(ordRx,"ord="+newOrd+"?");
                    $(srcId).siblings().not('iframe').remove();
                    $(srcId).attr('src',adUrl+cb+ts);
                }
            }

            function insertFinalAd(){
                var lazyEndAd = document.createElement("iframe");
                lazyEndAd.setAttribute("id","flipBook-end-ad300x250");
                lazyEndAd.setAttribute("name","flipBook-end-ad300x250");
                lazyEndAd.setAttribute("src","/modal/flipbook-iframe-end-ad.jsp?url="+endAdURL+"&i="+endAdI+"&t="+endAdT+"&ord="+adOrd+"&iframe=true");
                lazyEndAd.setAttribute("scrolling","no");
                lazyEndAd.setAttribute("frameBorder","0");
                lazyEndAd.setAttribute("allowTransparency","true");
                $(".flipbook-end-ad-copy").after(lazyEndAd);
                $("#flipBook-end-ad300x250").css({border:"none",margin:0,padding:0,overflow:"hidden",width:"300px",height:"250px"});
                s.linkTrackVars = "events";
                s.linkTrackEvents = 'event4';
                s.tl(this, 'o', 'ad impression');
            }

            function endCheck(){
                if(DAILYCANDY.flipbook.currentSlide + 1 > DAILYCANDY.flipbook.lastSlide && $('#module-flipbook-end-ad iframe').length < 1 ){
                    $("#module-flipbook-controls, #module-flipbook-wrap, #module-flipbook, #module-flipbook-like-tweet").remove();
                    $("#module-flipbook-end").show();
                    refreshFrame('#flipBook-ad728x90');
                    refreshFrame('#flipBook-ad300x250');
                    insertFinalAd();
                    
                    // Attach handlers for the last slide
                    lastSlide();
                }
            }
            
            // On the last slide (ad), enable the back button to go to the previous slide. 
            // Also attach a handler for the clicking of the back arrow (graphic)
            function lastSlide() {
            	var reload = function(){window.location.reload();};            	
				$("#prevSlideEnd").click( function() {
					reload();
				});				
				$(document).keydown(function(e) {
					if(e.keyCode == 37) { // left arrow
						reload();
					}
				});				
			}
           

            if ( DAILYCANDY.utils.getHashValue('vwink') ) {
                DAILYCANDY.omniture.campaign = DAILYCANDY.utils.getHashValue('vwink');
            }
            
            var startingSlide = (args.startingSlide) ? (args.startingSlide-1 < 0 ) ? 0:(args.startingSlide-1):0;

            $('#module-flipbook').cycle({ 
                fx:     'fade', 
                timeout: 5000,
                speed:  400,
                height: 345,
                easing:  'easeInOutQuint',
                next: '.nextSlide',
                prev: '.prevSlide',
                startingSlide: startingSlide,
                cleartype: 1,
                nowrap: 1,
                after: function(curr, next, opts){
                    if ( args.startingSlide > 0 ) DAILYCANDY.omniture.delay = true;
                    
                    //if ( window.location.hash.length == 0) skipSlideSlideTracking = true;
                    prevSlide = DAILYCANDY.flipbook.currentSlide;
                    DAILYCANDY.flipbook.currentSlide = parseInt(opts.currSlide)+1;
                    DAILYCANDY.flipbook.lastSlide = opts.slideCount;
                    var count = DAILYCANDY.flipbook.currentSlide + ' of ' + opts.slideCount;
                    $('#counter').html(count);

                    window.location.hash = "#slide="+(DAILYCANDY.flipbook.currentSlide);
                    document.title = slides[DAILYCANDY.flipbook.currentSlide - 1].pageTitle + ' - DailyCandy';

                    DAILYCANDY.flipbook.currentSlide == 1 ? $('.prevSlide').hide() : $('.prevSlide').show();
                    
                    if(typeof(prevSlide) != 'undefined' ) { // if this is defined we know that the 'slideshow' is playing, or the flipbook is being clicked through
                        refreshFrame('#flipBook-ad728x90');
                        refreshFrame('#flipBook-ad300x250');
                    }
                    $(document).ready( function() {
                        // this conditional makes sure that:
                        // a) omniture's s var exists
                        // b) the location.hash matches the expected current slide. this prevents reporting on slide #1 when the user loaded, say, #4
                        if(typeof(s) != "undefined" && DAILYCANDY.utils.getHashValue('slide')) {
                            var pageName = s.pageName,
                            refactorPageName = ":" + s.prop5 + ":slide", 
                            lastIdx = pageName.lastIndexOf(refactorPageName);

                            if(lastIdx > -1) {
                                pageName = pageName.substring(0, lastIdx);
                            }
                            
                            pageName = pageName + refactorPageName + DAILYCANDY.flipbook.currentSlide;
                            trackQueue.push(pageName);
                            trackSlides();
                        }
                    });
                },
                end: function() {
                    $("#module-flipbook-controls, #module-flipbook-wrap, #module-flipbook, #module-flipbook-like-tweet").remove();
                    $("#module-flipbook-end").show();
                    refreshFrame('#flipBook-ad728x90');
                    refreshFrame('#flipBook-ad300x250');
                    insertFinalAd();
                    lastSlide();
                }
            }).cycle('pause');

            $('#pause').click(function() { 
                $('#module-flipbook').cycle('pause'); 
                $(this).hide();
                $('#resume').show();
            });
            
            $('#resume').click(function() { 
                $('#module-flipbook').cycle('next'); 
                $('#module-flipbook').cycle('resume'); 
                $(this).hide();
                $('#pause').show();
            });

            // keyboard nav
            $(document).keydown(function(e) {
              if(e.keyCode == 37) { // left arrow
                $('#module-flipbook').cycle('prev'); 
              }
              else if(e.keyCode == 39) { // right arrow
                $('#module-flipbook').cycle('next');
                endCheck();
              }
            });

            $("#module-flipbook-wrap").hover(function() {
                $("#module-flipbook-hover-nav, .slideCredit").fadeIn('fast');
            },
                function() {
                $("#module-flipbook-hover-nav").fadeOut('fast');
            });
            
            $('.nextSlide').click(function() {
                endCheck();
            });

            if ( $('#module-flipbook').children().length == 1 ) {
                $('#module-flipbook-controls').remove();
                $('#module-flipbook-hover-nav').remove();
            }
            
        }
    },
    holiday: {
        
        carousel: function() {
            if (typeof products != "undefined") {
                var buttons = [];
                var divslidecontrols = $('#slides-controls');

                var ulslideitems = $('#slide-items');
                ulslideitems.empty();

                var subtitle = "";

                for (var i = 0, jj = products.length; i < jj; i++) {
                    subtitle = products[i].type;

                    if(subtitle == "Gallery") {
                        subtitle = "Photo Gallery";
                    }else if(subtitle == "DealsEmail") {
                        subtitle = "Deals";
                    }else {
                        subtitle = products[i].subtitle;
                    }

                    var target = "";
                    if (typeof products[i].target != 'undefined') {
                        target = ' target="' + products[i].target + '"';
                    }
                    
                    ulslideitems.append(
                        "<li><a href='" + products[i].url + "'" + target + "><img src='" + products[i].img + "' alt='" + products[i].title + "' width='380' height='285' /></a>" +
                            "<span class='box'>" +
                                "<h3>" + products[i].date + "</h3>" +
                                "<h1><a href='" + products[i].url + "'>" + products[i].title + "</a></h1>" +
                                "<h2>" + subtitle + "</h2>" +
                                "<p>"+products[i].summary+"</p>"+
                            "</span>"+
                        "<\/li>");
                }

                $('#slide-items').cycle({ 
                    fx:     'scrollHorz', 
                    timeout: 5000,
                    speed:  800,
                    easing:  'easeInOutQuint',
                    pager:  '.slides-control',
                    next: '.next',
                    prev: '.prev',
                    activePagerClass: 'active',
                    cleartype: !$.support.opacity
                });
                
                $('div.slides-control a').each( function() {
                    if ( $(this).text().length == 2 ) $(this).addClass('double-digit');
                });

            }
        }
    },
    profile : {
		update : function(){
			$("#subscribe-form").submit(function() {  
				
				//Omniture tracking
				var s=s_gi(s_account);
				s.linkTrackVars='prop43,events';
				s.linkTrackEvents='event40';
				s.prop43='click>dc|subscription process|profile>update';
				s.events='event40';
				s.tl(true,'o','update_profile');
				
				return;
			}); 
		},
		init : function(){
			DAILYCANDY.profile.update();
		}
	}
};

jQuery.extend( jQuery.easing, {
    easeInOutQuint: function (x, t, b, c, d) {
        if ((t/=d/2) < 1) {return c/2*t*t*t*t*t + b;}
        return c/2*((t-=2)*t*t*t*t + 2) + b;
    }
});

$.fn.cycle.transitions.scrollVertUp = function($cont, $slides, opts) {
        $cont.css('overflow','hidden');
        opts.before.push(function(curr, next, opts, fwd) {
                $.fn.cycle.commonReset(curr,next,opts);
                opts.cssBefore.top = fwd ? (next.cycleH-1) : (1-next.cycleH);
                opts.animOut.top = fwd ? -curr.cycleH : curr.cycleH;
        });
        opts.cssFirst = {top: 0};
        opts.cssBefore= {left: 0};
        opts.animIn   = {top: 0};
        opts.animOut  = {left: 0};
};


$(document).ready(function() {

	//top comment icon
	$("#module-article .comments, #module-listing .comments").click(function() {
		$.scrollTo( '#comments', 800, { easing:'easeInOutQuint' });

		return false;
	});

	//cancel comment
	$("#module-comments").find(".cancel-button").click(function() {
		$("#commentArea").val('');
		$("#inReplyTo").html('').slideUp("fast");
		$("#replyToId").val('0');
		$("#postComment a").html("Post a comment...");
		$.scrollTo('#comments', 1000, { easing:'easeInOutQuint' });

		if ($("#module-comments").find(".comment-error").length > 0 ) {
			$("#module-comments").find(".comment-error").slideUp("fast");
		}

		return false;
	});
	
	
	
    $("#module-comments").find("a.reply").click(function() {

        if ($("#module-comments").find(".comment-error").length > 0 ) {
            $("#module-comments").find(".comment-error").hide();
        }

        $("#postComment a").html("Post a comment in reply to:");

        var replyID = $(this).attr("id").substring(6);

        var cText = $("#comment-"+replyID+" p.text").html();
        var cSubscriber = $("#comment-"+replyID+" p.info span.subscriber").html();
        var cPostDate = $("#comment-"+replyID+" p.info span.postDate").html();
        
        $("#replyToId").val(replyID);

        $("#inReplyTo").html(
            '<div class="comment">' + 
            '<p class="info">Posted by <span>' + cSubscriber + '</span> on ' + cPostDate + '</p>' + 
            '<p>' + cText + '</p>' + 
            '</div>').slideDown("fast");

        $.scrollTo('#postComment', 1200, { easing:'easeInOutQuint' });

        return false;
    });

    
    //delete comment
    $("#module-comments").find("a.delete").click(function() {

        if ($("#module-comments").find(".comment-error").length > 0 ) {
            $("#module-comments").find(".comment-error").hide();
        }
        var confirmed = confirm('Are you sure you want to delete this comment? Click OK to delete, or Cancel to abort.');
        if (confirmed) {
            var deleteID = $(this).attr("id").substring(7);
            var subscriberID = $(this).attr("name");
            var dataD = {commentId: deleteID};
            $.ajax({
                url: '/rest/comment/'+subscriberID+'/delete',  
                type: 'POST',
                data: dataD,                                    
                success: function(data){
                    location.reload();
                },
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                    alert("ERROR " + XMLHttpRequest.status);
                }
            });

        }

        return false;
    });
    ;

	//report this
	$("a.inline").fancybox({
		'overlayShow': true,
		'hideOnContentClick': false,
		'padding': 0,
		'frameHeight': 220,
		'frameWidth': 450
	});

});

// The DAILYCANDY namespace is defined in script.js and is passed as the 2nd argument here
// @tag references: http://code.google.com/p/jsdoc-toolkit/wiki/TagReference
DAILYCANDY.ADAPTER = function($, DC) {
	return {
		// Common methods
		controller : {
			/* @function
			 * Checks if ID of DOM element is on the page
			 * @param {String} id Id of element to be checked
			 */
			checkID : function(id) {
				return (document.getElementById(id)) ? true : false;
			}
		},
		methods : {
			/* @function
			 * Adds the .sponsored-row class to the row that needs it
			 * NOTE: I couldn't use nth-child selector cause it fails on IE < 9
			 */
			sponsoredRow : function() {
				var $sponsored = $('tr.sponsored-row');
				if(DC.ADAPTER.controller.checkID('module-fragment-sidebar')) {
					$sponsored.find('td:eq(0)').addClass('sponsoredRow0 sponsoredRow1');
					$sponsored.find('td:eq(1)').addClass('sponsoredRow1');
				}
			},
			/* @function
			 * Certain edtions shouldn't have Swirl checked on the account/create page, this makes sure it's not checked
			 * @param {String} cName Name of cookie to check 
			 * @param {String} cVal Value of cName
			 */
			swirlChecker : function(cName, cVal) {
				if(DC.ADAPTER.controller.checkID('module-account-settings')){
					if ($.cookie(cName) == cVal){
						$('input#swirl').attr('checked', false);
						console.info('Unchecked!!');
					}		
				} 				
			}
		},
		// Event binding
		eventBinder : function() {
		},
		// functions that will always be called
		required : function() {
			$(function() {
				DC.ADAPTER.methods.sponsoredRow();
				DC.ADAPTER.methods.swirlChecker('edition_main', 'london');
				DC.ADAPTER.methods.swirlChecker('edition_kids', 'london');
			});
		},
		// Call initializtion methods
		init : function() {
			DC.ADAPTER.required();
		}
	};
}(jQuery, DAILYCANDY);
DAILYCANDY.ADAPTER.init();
var mboxCopyright = "Copyright 1996-2011. Adobe Systems Incorporated. All rights reserved.";
mboxUrlBuilder = function (a, b) {
    this.a = a;
    this.b = b;
    this.c = new Array();
    this.d = function (e) {
        return e;
    };
    this.f = null;
};
mboxUrlBuilder.prototype.addParameter = function (g, h) {
    var i = new RegExp('(\'|")');
    if (i.exec(g)) {
        throw "Parameter '" + g + "' contains invalid characters";
    }
    for (var j = 0; j < this.c.length; j++) {
        var k = this.c[j];
        if (k.name == g) {
            k.value = h;
            return this;
        }
    }
    var l = new Object();
    l.name = g;
    l.value = h;
    this.c[this.c.length] = l;
    return this;
};
mboxUrlBuilder.prototype.addParameters = function (c) {
    if (!c) {
        return this;
    }
    for (var j = 0; j < c.length; j++) {
        var m = c[j].indexOf('=');
        if (m == -1 || m == 0) {
            continue;
        }
        this.addParameter(c[j].substring(0, m), c[j].substring(m + 1, c[j].length));
    }
    return this;
};
mboxUrlBuilder.prototype.setServerType = function (n) {
    this.o = n;
};
mboxUrlBuilder.prototype.setBasePath = function (f) {
    this.f = f;
};
mboxUrlBuilder.prototype.setUrlProcessAction = function (p) {
    this.d = p;
};
mboxUrlBuilder.prototype.buildUrl = function () {
    var q = this.f ? this.f : '/m2/' + this.b + '/mbox/' + this.o;
    var r = document.location.protocol == 'file:' ? 'http:' : document.location.protocol;
    var e = r + "//" + this.a + q;
    var s = e.indexOf('?') != -1 ? '&' : '?';
    for (var j = 0; j < this.c.length; j++) {
        var k = this.c[j];
        e += s + encodeURIComponent(k.name) + '=' + encodeURIComponent(k.value);
        s = '&';
    }
    return this.t(this.d(e));
};
mboxUrlBuilder.prototype.getParameters = function () {
    return this.c;
};
mboxUrlBuilder.prototype.setParameters = function (c) {
    this.c = c;
};
mboxUrlBuilder.prototype.clone = function () {
    var u = new mboxUrlBuilder(this.a, this.b);
    u.setServerType(this.o);
    u.setBasePath(this.f);
    u.setUrlProcessAction(this.d);
    for (var j = 0; j < this.c.length; j++) {
        u.addParameter(this.c[j].name, this.c[j].value);
    }
    return u;
};
mboxUrlBuilder.prototype.t = function (v) {
    return v.replace(/\"/g, '&quot;').replace(/>/g, '&gt;');
};
mboxStandardFetcher = function () {};
mboxStandardFetcher.prototype.getType = function () {
    return 'standard';
};
mboxStandardFetcher.prototype.fetch = function (w) {
    w.setServerType(this.getType());
    document.write('<' + 'scr' + 'ipt src="' + w.buildUrl() + '" language="JavaScript"><' + '\/scr' + 'ipt>');
};
mboxStandardFetcher.prototype.cancel = function () {};
mboxAjaxFetcher = function () {};
mboxAjaxFetcher.prototype.getType = function () {
    return 'ajax';
};
mboxAjaxFetcher.prototype.fetch = function (w) {
    w.setServerType(this.getType());
    var e = w.buildUrl();
    this.x = document.createElement('script');
    this.x.src = e;
    document.body.appendChild(this.x);
};
mboxAjaxFetcher.prototype.cancel = function () {};
mboxMap = function () {
    this.y = new Object();
    this.z = new Array();
};
mboxMap.prototype.put = function (A, h) {
    if (!this.y[A]) {
        this.z[this.z.length] = A;
    }
    this.y[A] = h;
};
mboxMap.prototype.get = function (A) {
    return this.y[A];
};
mboxMap.prototype.remove = function (A) {
    this.y[A] = undefined;
};
mboxMap.prototype.each = function (p) {
    for (var j = 0; j < this.z.length; j++) {
        var A = this.z[j];
        var h = this.y[A];
        if (h) {
            var B = p(A, h);
            if (B === false) {
                break;
            }
        }
    }
};
mboxFactory = function (C, b, D) {
    this.E = false;
    this.C = C;
    this.D = D;
    this.F = new mboxList();
    mboxFactories.put(D, this);
    this.G = typeof document.createElement('div').replaceChild != 'undefined' && (function () {
        return true;
    })() && typeof document.getElementById != 'undefined' && typeof (window.attachEvent || document.addEventListener || window.addEventListener) != 'undefined' && typeof encodeURIComponent != 'undefined';
    this.H = this.G && mboxGetPageParameter('mboxDisable') == null;
    var I = D == 'default';
    this.J = new mboxCookieManager('mbox' + (I ? '' : ('-' + D)), (function () {
        return mboxCookiePageDomain();
    })());
    this.H = this.H && this.J.isEnabled() && (this.J.getCookie('disable') == null);
    if (this.isAdmin()) {
        this.enable();
    }
    this.K();
    this.L = mboxGenerateId();
    this.M = mboxScreenHeight();
    this.N = mboxScreenWidth();
    this.O = mboxBrowserWidth();
    this.P = mboxBrowserHeight();
    this.Q = mboxScreenColorDepth();
    this.R = mboxBrowserTimeOffset();
    this.S = new mboxSession(this.L, 'mboxSession', 'session', 31 * 60, this.J);
    this.T = new mboxPC('PC', 1209600, this.J);
    this.w = new mboxUrlBuilder(C, b);
    this.U(this.w, I);
    this.V = new Date().getTime();
    this.W = this.V;
    var X = this;
    this.addOnLoad(function () {
        X.W = new Date().getTime();
    });
    if (this.G) {
        this.addOnLoad(function () {
            X.E = true;
            X.getMboxes().each(function (Y) {
                Y.setFetcher(new mboxAjaxFetcher());
                Y.finalize();
            });
        });
        this.limitTraffic(100, 10368000);
        if (this.H) {
            this.Z();
            this._ = new mboxSignaler(function (ab, c) {
                return X.create(ab, c);
            }, this.J);
        }
    }
};
mboxFactory.prototype.isEnabled = function () {
    return this.H;
};
mboxFactory.prototype.getDisableReason = function () {
    return this.J.getCookie('disable');
};
mboxFactory.prototype.isSupported = function () {
    return this.G;
};
mboxFactory.prototype.disable = function (bb, cb) {
    if (typeof bb == 'undefined') {
        bb = 60 * 60;
    }
    if (typeof cb == 'undefined') {
        cb = 'unspecified';
    }
    if (!this.isAdmin()) {
        this.H = false;
        this.J.setCookie('disable', cb, bb);
    }
};
mboxFactory.prototype.enable = function () {
    this.H = true;
    this.J.deleteCookie('disable');
};
mboxFactory.prototype.isAdmin = function () {
    return document.location.href.indexOf('mboxEnv') != -1;
};
mboxFactory.prototype.limitTraffic = function (db, bb) {};
mboxFactory.prototype.addOnLoad = function (eb) {
    if (this.isDomLoaded()) {
        eb();
    } else {
        var fb = false;
        var gb = function () {
                if (fb) {
                    return;
                }
                fb = true;
                eb();
            };
        this.hb.push(gb);
        if (this.isDomLoaded() && !fb) {
            gb();
        }
    }
};
mboxFactory.prototype.getEllapsedTime = function () {
    return this.W - this.V;
};
mboxFactory.prototype.getEllapsedTimeUntil = function (ib) {
    return ib - this.V;
};
mboxFactory.prototype.getMboxes = function () {
    return this.F;
};
mboxFactory.prototype.get = function (ab, jb) {
    return this.F.get(ab).getById(jb || 0);
};
mboxFactory.prototype.update = function (ab, c) {
    if (!this.isEnabled()) {
        return;
    }
    if (!this.isDomLoaded()) {
        var X = this;
        this.addOnLoad(function () {
            X.update(ab, c);
        });
        return;
    }
    if (this.F.get(ab).length() == 0) {
        throw "Mbox " + ab + " is not defined";
    }
    this.F.get(ab).each(function (Y) {
        Y.getUrlBuilder().addParameter('mboxPage', mboxGenerateId());
        Y.load(c);
    });
};
mboxFactory.prototype.create = function (ab, c, kb) {
    if (!this.isSupported()) {
        return null;
    }
    var e = this.w.clone();
    e.addParameter('mboxCount', this.F.length() + 1);
    e.addParameters(c);
    var jb = this.F.get(ab).length();
    var lb = this.D + '-' + ab + '-' + jb;
    var mb;
    if (kb) {
        mb = new mboxLocatorNode(kb);
    } else {
        if (this.E) {
            throw 'The page has already been loaded, can\'t write marker';
        }
        mb = new mboxLocatorDefault(lb);
    }
    try {
        var X = this;
        var nb = 'mboxImported-' + lb;
        var Y = new mbox(ab, jb, e, mb, nb);
        if (this.H) {
            Y.setFetcher(this.E ? new mboxAjaxFetcher() : new mboxStandardFetcher());
        }
        Y.setOnError(function (ob, n) {
            Y.setMessage(ob);
            Y.activate();
            if (!Y.isActivated()) {
                X.disable(60 * 60, ob);
                window.location.reload(false);
            }
        });
        this.F.add(Y);
    } catch (pb) {
        this.disable();
        throw 'Failed creating mbox "' + ab + '", the error was: ' + pb;
    }
    var qb = new Date();
    e.addParameter('mboxTime', qb.getTime() - (qb.getTimezoneOffset() * 60000));
    return Y;
};
mboxFactory.prototype.getCookieManager = function () {
    return this.J;
};
mboxFactory.prototype.getPageId = function () {
    return this.L;
};
mboxFactory.prototype.getPCId = function () {
    return this.T;
};
mboxFactory.prototype.getSessionId = function () {
    return this.S;
};
mboxFactory.prototype.getSignaler = function () {
    return this._;
};
mboxFactory.prototype.getUrlBuilder = function () {
    return this.w;
};
mboxFactory.prototype.U = function (e, I) {
    e.addParameter('mboxHost', document.location.hostname).addParameter('mboxSession', this.S.getId());
    if (!I) {
        e.addParameter('mboxFactoryId', this.D);
    }
    if (this.T.getId() != null) {
        e.addParameter('mboxPC', this.T.getId());
    }
    e.addParameter('mboxPage', this.L);
    e.addParameter('screenHeight', this.M);
    e.addParameter('screenWidth', this.N);
    e.addParameter('browserWidth', this.O);
    e.addParameter('browserHeight', this.P);
    e.addParameter('browserTimeOffset', this.R);
    e.addParameter('colorDepth', this.Q);
    e.setUrlProcessAction(function (e) {
        e += '&mboxURL=' + encodeURIComponent(document.location);
        var rb = encodeURIComponent(document.referrer);
        if (e.length + rb.length < 2000) {
            e += '&mboxReferrer=' + rb;
        }
        e += '&mboxVersion=' + mboxVersion;
        return e;
    });
};
mboxFactory.prototype.sb = function () {
    return "";
};
mboxFactory.prototype.Z = function () {
    document.write('<style>.' + 'mboxDefault' + ' { visibility:hidden; }</style>');
};
mboxFactory.prototype.isDomLoaded = function () {
//alert('domloadaded? ' + this.E);
    return this.E;
};
mboxFactory.prototype.K = function () {
    if (this.hb != null) {
        return;
    }
    this.hb = new Array();
    var X = this;
    (function () {
        var tb = document.addEventListener ? "DOMContentLoaded" : "onreadystatechange";
        var ub = false;
        var vb = function () {
                if (ub) {
                    return;
                }
                ub = true;
                for (var i = 0; i < X.hb.length; ++i) {
                    X.hb[i]();
                }
            };
        if (document.addEventListener) {
            document.addEventListener(tb, function () {
                document.removeEventListener(tb, arguments.callee, false);
                vb();
            }, false);
            window.addEventListener("load", function () {
                document.removeEventListener("load", arguments.callee, false);
                vb();
            }, false);
        } else if (document.attachEvent) {
            if (self !== self.top) {
                document.attachEvent(tb, function () {
                    if (document.readyState === 'complete') {
                        document.detachEvent(tb, arguments.callee);
                        vb();
                    }
                });
            } else {
                var wb = function () {
                        try {
                            document.documentElement.doScroll('left');
                            vb();
                        } catch (xb) {
                            setTimeout(wb, 13);
                        }
                    };
                wb();
            }
        }
        if (document.readyState === "complete") {
            vb();
        }
    })();
};
mboxSignaler = function (yb, J) {
    this.J = J;
    var zb = J.getCookieNames('signal-');
    for (var j = 0; j < zb.length; j++) {
        var Ab = zb[j];
        var Bb = J.getCookie(Ab).split('&');
        var Y = yb(Bb[0], Bb);
        Y.load();
        J.deleteCookie(Ab);
    }
};
mboxSignaler.prototype.signal = function (Cb, ab) {
    this.J.setCookie('signal-' + Cb, mboxShiftArray(arguments).join('&'), 45 * 60);
};
mboxList = function () {
    this.F = new Array();
};
mboxList.prototype.add = function (Y) {
    if (Y != null) {
        this.F[this.F.length] = Y;
    }
};
mboxList.prototype.get = function (ab) {
    var B = new mboxList();
    for (var j = 0; j < this.F.length; j++) {
        var Y = this.F[j];
        if (Y.getName() == ab) {
            B.add(Y);
        }
    }
    return B;
};
mboxList.prototype.getById = function (Db) {
    return this.F[Db];
};
mboxList.prototype.length = function () {
    return this.F.length;
};
mboxList.prototype.each = function (p) {
    if (typeof p != 'function') {
        throw 'Action must be a function, was: ' + typeof (p);
    }
    for (var j = 0; j < this.F.length; j++) {
        p(this.F[j]);
    }
};
mboxLocatorDefault = function (g) {
    this.g = 'mboxMarker-' + g;
    document.write('<div id="' + this.g + '" style="visibility:hidden;display:none">&nbsp;</div>');
};
mboxLocatorDefault.prototype.locate = function () {
    var Eb = document.getElementById(this.g);
    while (Eb != null) {
        if (Eb.nodeType == 1) {
            if (Eb.className == 'mboxDefault') {
                return Eb;
            }
        }
        Eb = Eb.previousSibling;
    }
    return null;
};
mboxLocatorDefault.prototype.force = function () {
    var Fb = document.createElement('div');
    Fb.className = 'mboxDefault';
    var Gb = document.getElementById(this.g);
    Gb.parentNode.insertBefore(Fb, Gb);
    return Fb;
};
mboxLocatorNode = function (Hb) {
    this.Eb = Hb;
};
mboxLocatorNode.prototype.locate = function () {
    return typeof this.Eb == 'string' ? document.getElementById(this.Eb) : this.Eb;
};
mboxLocatorNode.prototype.force = function () {
    return null;
};
mboxCreate = function (ab) {
    var Y = mboxFactoryDefault.create(ab, mboxShiftArray(arguments));
    if (Y) {
        Y.load();
    }
    return Y;
};
mboxDefine = function (kb, ab) {
    var Y = mboxFactoryDefault.create(ab, mboxShiftArray(mboxShiftArray(arguments)), kb);
    return Y;
};
mboxUpdate = function (ab) {
    mboxFactoryDefault.update(ab, mboxShiftArray(arguments));
};
mbox = function (g, Ib, w, Jb, nb) {
    this.Kb = null;
    this.Lb = 0;
    this.mb = Jb;
    this.nb = nb;
    this.Mb = null;
    this.Nb = new mboxOfferContent();
    this.Fb = null;
    this.w = w;
    this.message = '';
    this.Ob = new Object();
    this.Pb = 0;
    this.Ib = Ib;
    this.g = g;
    this.Qb();
    w.addParameter('mbox', g).addParameter('mboxId', Ib);
    this.Rb = function () {};
    this.Sb = function () {};
    this.Tb = null;
};
mbox.prototype.getId = function () {
    return this.Ib;
};
mbox.prototype.Qb = function () {
    if (this.g.length > 250) {
        throw "Mbox Name " + this.g + " exceeds max length of " + "250 characters.";
    } else if (this.g.match(/^\s+|\s+$/g)) {
        throw "Mbox Name " + this.g + " has leading/trailing whitespace(s).";
    }
};
mbox.prototype.getName = function () {
    return this.g;
};
mbox.prototype.getParameters = function () {
    var c = this.w.getParameters();
    var B = new Array();
    for (var j = 0; j < c.length; j++) {
        if (c[j].name.indexOf('mbox') != 0) {
            B[B.length] = c[j].name + '=' + c[j].value;
        }
    }
    return B;
};
mbox.prototype.setOnLoad = function (p) {
    this.Sb = p;
    return this;
};
mbox.prototype.setMessage = function (ob) {
    this.message = ob;
    return this;
};
mbox.prototype.setOnError = function (Rb) {
    this.Rb = Rb;
    return this;
};
mbox.prototype.setFetcher = function (Ub) {
    if (this.Mb) {
        this.Mb.cancel();
    }
    this.Mb = Ub;
    return this;
};
mbox.prototype.getFetcher = function () {
    return this.Mb;
};
mbox.prototype.load = function (c) {
    if (this.Mb == null) {
        return this;
    }
    this.setEventTime("load.start");
    this.cancelTimeout();
    this.Lb = 0;
    var w = (c && c.length > 0) ? this.w.clone().addParameters(c) : this.w;
    this.Mb.fetch(w);
    var X = this;
    this.Vb = setTimeout(function () {
        X.Rb('browser timeout', X.Mb.getType());
    }, 15000);
    this.setEventTime("load.end");
    return this;
};
mbox.prototype.loaded = function () {
    this.cancelTimeout();
    if (!this.activate()) {
        var X = this;
        setTimeout(function () {
            X.loaded();
        }, 100);
    }
};
mbox.prototype.activate = function () {
    if (this.Lb) {
        return this.Lb;
    }
    this.setEventTime('activate' + ++this.Pb + '.start');
    if (this.show()) {
        this.cancelTimeout();
        this.Lb = 1;
    }
    this.setEventTime('activate' + this.Pb + '.end');
    return this.Lb;
};
mbox.prototype.isActivated = function () {
    return this.Lb;
};
mbox.prototype.setOffer = function (Nb) {
    if (Nb && Nb.show && Nb.setOnLoad) {
        this.Nb = Nb;
    } else {
        throw 'Invalid offer';
    }
    return this;
};
mbox.prototype.getOffer = function () {
    return this.Nb;
};
mbox.prototype.show = function () {
    this.setEventTime('show.start');
    var B = this.Nb.show(this);
    this.setEventTime(B == 1 ? "show.end.ok" : "show.end");
    return B;
};
mbox.prototype.showContent = function (Wb) {
    if (Wb == null) {
        return 0;
    }
    if (this.Fb == null || !this.Fb.parentNode) {
        this.Fb = this.getDefaultDiv();
        if (this.Fb == null) {
            return 0;
        }
    }
    if (this.Fb != Wb) {
        this.Xb(this.Fb);
        this.Fb.parentNode.replaceChild(Wb, this.Fb);
        this.Fb = Wb;
    }
    this.Yb(Wb);
    this.Sb();
    return 1;
};
mbox.prototype.hide = function () {
    this.setEventTime('hide.start');
    var B = this.showContent(this.getDefaultDiv());
    this.setEventTime(B == 1 ? 'hide.end.ok' : 'hide.end.fail');
    return B;
};
mbox.prototype.finalize = function () {
    this.setEventTime('finalize.start');
    this.cancelTimeout();
    if (this.getDefaultDiv() == null) {
        if (this.mb.force() != null) {
            this.setMessage('No default content, an empty one has been added');
        } else {
            this.setMessage('Unable to locate mbox');
        }
    }
    if (!this.activate()) {
        this.hide();
        this.setEventTime('finalize.end.hide');
    }
    this.setEventTime('finalize.end.ok');
};
mbox.prototype.cancelTimeout = function () {
    if (this.Vb) {
        clearTimeout(this.Vb);
    }
    if (this.Mb != null) {
        this.Mb.cancel();
    }
};
mbox.prototype.getDiv = function () {
    return this.Fb;
};
mbox.prototype.getDefaultDiv = function () {
    if (this.Tb == null) {
        this.Tb = this.mb.locate();
    }
    return this.Tb;
};
mbox.prototype.setEventTime = function (Zb) {
    this.Ob[Zb] = (new Date()).getTime();
};
mbox.prototype.getEventTimes = function () {
    return this.Ob;
};
mbox.prototype.getImportName = function () {
    return this.nb;
};
mbox.prototype.getURL = function () {
    return this.w.buildUrl();
};
mbox.prototype.getUrlBuilder = function () {
    return this.w;
};
mbox.prototype._b = function (Fb) {
    return Fb.style.display != 'none';
};
mbox.prototype.Yb = function (Fb) {
    this.ac(Fb, true);
};
mbox.prototype.Xb = function (Fb) {
    this.ac(Fb, false);
};
mbox.prototype.ac = function (Fb, bc) {
    Fb.style.visibility = bc ? "visible" : "hidden";
    Fb.style.display = bc ? "block" : "none";
};
mboxOfferContent = function () {
    this.Sb = function () {};
};
mboxOfferContent.prototype.show = function (Y) {
    var B = Y.showContent(document.getElementById(Y.getImportName()));
    if (B == 1) {
        this.Sb();
    }
    return B;
};
mboxOfferContent.prototype.setOnLoad = function (Sb) {
    this.Sb = Sb;
};
mboxOfferAjax = function (Wb) {
    this.Wb = Wb;
    this.Sb = function () {};
};
mboxOfferAjax.prototype.setOnLoad = function (Sb) {
    this.Sb = Sb;
};
mboxOfferAjax.prototype.show = function (Y) {
    var cc = document.createElement('div');
    cc.id = Y.getImportName();
    cc.innerHTML = this.Wb;
    var B = Y.showContent(cc);
    if (B == 1) {
        this.Sb();
    }
    return B;
};
mboxOfferDefault = function () {
    this.Sb = function () {};
};
mboxOfferDefault.prototype.setOnLoad = function (Sb) {
    this.Sb = Sb;
};
mboxOfferDefault.prototype.show = function (Y) {
    var B = Y.hide();
    if (B == 1) {
        this.Sb();
    }
    return B;
};
mboxCookieManager = function mboxCookieManager(g, dc) {
    this.g = g;
    this.dc = dc == '' || dc.indexOf('.') == -1 ? '' : '; domain=' + dc;
    this.ec = new mboxMap();
    this.loadCookies();
};
mboxCookieManager.prototype.isEnabled = function () {
    this.setCookie('check', 'true', 60);
    this.loadCookies();
    return this.getCookie('check') == 'true';
};
mboxCookieManager.prototype.setCookie = function (g, h, bb) {
    if (typeof g != 'undefined' && typeof h != 'undefined' && typeof bb != 'undefined') {
        var fc = new Object();
        fc.name = g;
        fc.value = escape(h);
        fc.expireOn = Math.ceil(bb + new Date().getTime() / 1000);
        this.ec.put(g, fc);
        this.saveCookies();
    }
};
mboxCookieManager.prototype.getCookie = function (g) {
    var fc = this.ec.get(g);
    return fc ? unescape(fc.value) : null;
};
mboxCookieManager.prototype.deleteCookie = function (g) {
    this.ec.remove(g);
    this.saveCookies();
};
mboxCookieManager.prototype.getCookieNames = function (gc) {
    var hc = new Array();
    this.ec.each(function (g, fc) {
        if (g.indexOf(gc) == 0) {
            hc[hc.length] = g;
        }
    });
    return hc;
};
mboxCookieManager.prototype.saveCookies = function () {
    var ic = new Array();
    var jc = 0;
    this.ec.each(function (g, fc) {
        ic[ic.length] = g + '#' + fc.value + '#' + fc.expireOn;
        if (jc < fc.expireOn) {
            jc = fc.expireOn;
        }
    });
    var kc = new Date(jc * 1000);
    document.cookie = this.g + '=' + ic.join('|') + '; expires=' + kc.toGMTString() + '; path=/' + this.dc;
};
mboxCookieManager.prototype.loadCookies = function () {
    this.ec = new mboxMap();
    var lc = document.cookie.indexOf(this.g + '=');
    if (lc != -1) {
        var mc = document.cookie.indexOf(';', lc);
        if (mc == -1) {
            mc = document.cookie.indexOf(',', lc);
            if (mc == -1) {
                mc = document.cookie.length;
            }
        }
        var nc = document.cookie.substring(lc + this.g.length + 1, mc).split('|');
        var oc = Math.ceil(new Date().getTime() / 1000);
        for (var j = 0; j < nc.length; j++) {
            var fc = nc[j].split('#');
            if (oc <= fc[2]) {
                var pc = new Object();
                pc.name = fc[0];
                pc.value = fc[1];
                pc.expireOn = fc[2];
                this.ec.put(pc.name, pc);
            }
        }
    }
};
mboxSession = function (qc, rc, Ab, sc, J) {
    this.rc = rc;
    this.Ab = Ab;
    this.sc = sc;
    this.J = J;
    this.tc = false;
    this.Ib = typeof mboxForceSessionId != 'undefined' ? mboxForceSessionId : mboxGetPageParameter(this.rc);
    if (this.Ib == null || this.Ib.length == 0) {
        this.Ib = J.getCookie(Ab);
        if (this.Ib == null || this.Ib.length == 0) {
            this.Ib = qc;
            this.tc = true;
        }
    }
    J.setCookie(Ab, this.Ib, sc);
};
mboxSession.prototype.getId = function () {
    return this.Ib;
};
mboxSession.prototype.forceId = function (uc) {
    this.Ib = uc;
    this.J.setCookie(this.Ab, this.Ib, this.sc);
};
mboxPC = function (Ab, sc, J) {
    this.Ab = Ab;
    this.sc = sc;
    this.J = J;
    this.Ib = typeof mboxForcePCId != 'undefined' ? mboxForcePCId : J.getCookie(Ab);
    if (this.Ib != null) {
        J.setCookie(Ab, this.Ib, sc);
    }
};
mboxPC.prototype.getId = function () {
    return this.Ib;
};
mboxPC.prototype.forceId = function (uc) {
    if (this.Ib != uc) {
        this.Ib = uc;
        this.J.setCookie(this.Ab, this.Ib, this.sc);
        return true;
    }
    return false;
};
mboxGetPageParameter = function (g) {
    var B = null;
    var vc = new RegExp(g + "=([^\&]*)");
    var wc = vc.exec(document.location);
    if (wc != null && wc.length >= 2) {
        B = wc[1];
    }
    return B;
};
mboxSetCookie = function (g, h, bb) {
    return mboxFactoryDefault.getCookieManager().setCookie(g, h, bb);
};
mboxGetCookie = function (g) {
    return mboxFactoryDefault.getCookieManager().getCookie(g);
};
mboxCookiePageDomain = function () {
    var dc = (/([^:]*)(:[0-9]{0,5})?/).exec(document.location.host)[1];
    var xc = /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/;
    if (!xc.exec(dc)) {
        var yc = (/([^\.]+\.[^\.]{3}|[^\.]+\.[^\.]+\.[^\.]{2})$/).exec(dc);
        if (yc) {
            dc = yc[0];
        }
    }
    return dc ? dc : "";
};
mboxShiftArray = function (zc) {
    var B = new Array();
    for (var j = 1; j < zc.length; j++) {
        B[B.length] = zc[j];
    }
    return B;
};
mboxGenerateId = function () {
    return (new Date()).getTime() + "-" + Math.floor(Math.random() * 999999);
};
mboxScreenHeight = function () {
    return screen.height;
};
mboxScreenWidth = function () {
    return screen.width;
};
mboxBrowserWidth = function () {
    return (window.innerWidth) ? window.innerWidth : document.documentElement ? document.documentElement.clientWidth : document.body.clientWidth;
};
mboxBrowserHeight = function () {
    return (window.innerHeight) ? window.innerHeight : document.documentElement ? document.documentElement.clientHeight : document.body.clientHeight;
};
mboxBrowserTimeOffset = function () {
    return -new Date().getTimezoneOffset();
};
mboxScreenColorDepth = function () {
    return screen.pixelDepth;
};
if (typeof mboxVersion == 'undefined') {
    var mboxVersion = 40;
    var mboxFactories = new mboxMap();
    var mboxFactoryDefault = new mboxFactory('dailycandyllc.tt.omtrdc.net', 'dailycandyllc', 'default');
};
if (mboxGetPageParameter("mboxDebug") != null || mboxFactoryDefault.getCookieManager().getCookie("debug") != null) {
    setTimeout(function () {
        if (typeof mboxDebugLoaded == 'undefined') {
            alert('Could not load the remote debug.\nPlease check your connection' + ' to Test&amp;Target servers');
        }
    }, 60 * 60);
    document.write('<' + 'scr' + 'ipt language="Javascript1.2" src=' + '"http://admin6.testandtarget.omniture.com/admin/mbox/mbox_debug.jsp?mboxServerHost=dailycandyllc.tt.omtrdc.net' + '&clientCode=dailycandyllc"><' + '\/scr' + 'ipt>');
};
mboxScPluginFetcher = function (b, Ac) {
    this.b = b;
    this.Ac = Ac;
};
mboxScPluginFetcher.prototype.Bc = function (w) {
    w.setBasePath('/m2/' + this.b + '/sc/standard');
    this.Cc(w);
    var e = w.buildUrl();
    e += '&scPluginVersion=1';
    return e;
};
mboxScPluginFetcher.prototype.Cc = function (w) {
    var Dc = ["dynamicVariablePrefix", "visitorID", "vmk", "ppu", "charSet", "visitorNamespace", "cookieDomainPeriods", "cookieLifetime", "pageName", "currencyCode", "variableProvider", "channel", "server", "pageType", "transactionID", "purchaseID", "campaign", "state", "zip", "events", "products", "linkName", "linkType", "resolution", "colorDepth", "javascriptVersion", "javaEnabled", "cookiesEnabled", "browserWidth", "browserHeight", "connectionType", "homepage", "pe", "pev1", "pev2", "pev3", "visitorSampling", "visitorSamplingGroup", "dynamicAccountSelection", "dynamicAccountList", "dynamicAccountMatch", "trackDownloadLinks", "trackExternalLinks", "trackInlineStats", "linkLeaveQueryString", "linkDownloadFileTypes", "linkExternalFilters", "linkInternalFilters", "linkTrackVars", "linkTrackEvents", "linkNames", "lnk", "eo"];
    for (var j = 0; j < Dc.length; j++) {
        this.Ec(Dc[j], w);
    }
    for (var j = 1; j <= 75; j++) {
        this.Ec('prop' + j, w);
        this.Ec('eVar' + j, w);
        this.Ec('hier' + j, w);
    }
};
mboxScPluginFetcher.prototype.Ec = function (g, w) {
    var h = this.Ac[g];
    if (typeof (h) === 'undefined' || h === null || h === '') {
        return;
    }
    w.addParameter(g, h);
};
mboxScPluginFetcher.prototype.cancel = function () {};
mboxStandardScPluginFetcher = function (b, Ac) {
    mboxScPluginFetcher.call(this, b, Ac);
};
mboxStandardScPluginFetcher.prototype = new mboxScPluginFetcher;
mboxStandardScPluginFetcher.prototype.getType = function () {
    return 'standard';
};
mboxStandardScPluginFetcher.prototype.fetch = function (w) {
    w.setServerType(this.getType());
    var e = this.Bc(w);
    document.write('<' + 'scr' + 'ipt src="' + e + '" language="JavaScript"><' + '\/scr' + 'ipt>');
};
mboxAjaxScPluginFetcher = function (b, Ac) {
    mboxScPluginFetcher.call(this, b, Ac);
};
mboxAjaxScPluginFetcher.prototype = new mboxScPluginFetcher;
mboxAjaxScPluginFetcher.prototype.fetch = function (w) {
    w.setServerType(this.getType());
    var e = this.Bc(w);
    this.x = document.createElement('script');
    this.x.src = e;
    document.body.appendChild(this.x);
};
mboxAjaxScPluginFetcher.prototype.getType = function () {
    return 'ajax';
};

function mboxLoadSCPlugin(Ac) {
    if (!Ac) {
        return null;
    }
	
    Ac.m_tt = function (Ac) {
        var Fc = Ac.m_i('tt');
        Fc.H = true;
        Fc.b = 'dailycandyllc';
        Fc['_t'] = function () {
            if (!this.isEnabled()) {
                return;
            }
            var Y = this.Hc();
            if (Y) {
                var Ub = mboxFactoryDefault.isDomLoaded() ? new mboxAjaxScPluginFetcher(this.b, this.s) : new mboxStandardScPluginFetcher(this.b, this.s);
                Y.setFetcher(Ub);
                Y.load();
            }
        };
        Fc.isEnabled = function () {
            return this.H && mboxFactoryDefault.isEnabled();
        };
        Fc.Hc = function () {
            var ab = this.Ic();
            var Fb = document.createElement('DIV');
            return mboxFactoryDefault.create(ab, new Array(), Fb);
        };
        Fc.Ic = function () {
            var Jc = this.s.events && this.s.events.indexOf('purchase') != -1;
            return 'SiteCatalyst: ' + (Jc ? 'purchase' : 'event');
        };
    };
    return Ac.loadModule('tt');
};

// hack from Adobe to prevent the document.write bug
mboxStandardScPluginFetcher = mboxAjaxScPluginFetcher;
var _sf_startpt=(new Date()).getTime(),
	_sf_async_config={uid:26099,domain:"dailycandy.com"};
	
// Redefine path for vwink reporting	
_sf_async_config.path = location.pathname.split("?")[0];
(function(){
  function loadChartbeat() {
    window._sf_endpt=(new Date()).getTime();
    var e = document.createElement('script');
    e.setAttribute('language', 'javascript');
    e.setAttribute('type', 'text/javascript');
    e.setAttribute('src',
       (("https:" == document.location.protocol) ? "https://a248.e.akamai.net/chartbeat.download.akamai.com/102508/" : "http://static.chartbeat.com/") +
       "js/chartbeat.js");
    document.body.appendChild(e);
  }
  var oldonload = window.onload;
  window.onload = (typeof window.onload != 'function') ?
     loadChartbeat : function() { oldonload(); loadChartbeat(); };
})();

