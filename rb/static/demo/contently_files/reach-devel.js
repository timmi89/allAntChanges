(function(window, document, noop){
/**
 * Initializes the SPR Object.
 *
 * We want to expose as little to the window as possible, so we added a helper
 * function that allows our scripts to create an object inside the SPR
 * namespace called "provide"
 */
if (!window.SPR){
  /**
   * Expose the SPR Object to the window, we use window['SPR'] rather
   * Rather than window.SPR because advanced optimizations changes anything
   * not set as a string
   */
  window.SPR = {
    /**
     * Creates an object in the SPR namespace
     * Use this instead of an anonymous function to make things a bit
     * cleaner in our code
     *
     * Usage:
     * SPR.provide('Util', {
     *  foo:'bar'
     * });
     */
    provide: function(name, value){
      if (!SPR[name]){
        SPR[name] = value;
        //run the initializer if it exists
        if (typeof SPR[name].init === 'function'){
          SPR[name].init();
        }
      }
    }
  };
}

//make it privately available to our api
var SPR = window.SPR;/*global SPR noop*/

/**
 * Common commands used thorught the SPR Scripts
 */
SPR.provide('Common', {
  /**
   * Gets a random whole number between 1 and Jenny's phone number
   *
   */
  random: function(){
    return Math.floor(Math.random() * 8675309);
  },

  /**
   * Checks if an object is an array
   *
   * First we check if isArray exists already on the Array object and
   * use that if we can, if not then we call toString on the Object to
   * varify if it is an array, we use the prototype method to be safe
   *
   * @param value {Object} The object to test if is an array
   */
  isArray: function(value){
    return Array.isArray ?
             Array.isArray(value) :
             Object.prototype.toString.call(value) === '[object Array]';
  },

  /**
   * Checks if an object is a string
   */
  isString: function(obj) {
    return Object.prototype.toString.call(obj) === '[object String]';
  },

  /**
   * Checks if the object has its own property
   */
  hasOwnProperty: function(obj, prop){
    return Object.prototype.hasOwnProperty.call(obj, prop);
  }
});/*global SPR noop*/

/**
 * Adds a set of functions fo rmanipulating the DOM
 * This is probably the most important piece to get cross-browser compliant
 */
SPR.provide('DOM', {
  /**
   * Initializes the object
   */
  init: function(){
    /**
     * Alias for attachEvent & detachEvent
     */
    SPR.DOM.on = SPR.DOM.attachEvent;
    SPR.DOM.off = SPR.DOM.detachEvent;

    function addEventLoad(){
      SPR.DOM.flush();
      window.removeEventListener('DOMContentLoaded', addEventLoad, false);
    }

    var notFired = true;

    function attachEventLoad(){
      if (/loaded|interactive|complete/.test(document.readyState)) {
        document.detachEvent('onreadystatechange', attachEventLoad);
        if (notFired) {
          notFired = false;
          SPR.DOM.flush();
        }
      }
    }

    if(window.addEventListener){
      window.addEventListener('DOMContentLoaded', addEventLoad);
    }

    if(document.attachEvent){
      document.attachEvent('onreadystatechange', attachEventLoad);
    }
  },
  /**
   * Adds a script tag to the head of the document
   *
   */
   addScript: function(src) {
     var script = document.createElement('script');
     script.type = 'text/javascript';
     script.setAttribute('async', true);
     script.setAttribute('name', 'spr');
     script.src = src;

     //let the dom complete loading in older browsers
     SPR.DOM.onReady(function(){

       setTimeout(function(){
         SPR.DOM.$('HEAD')[0].appendChild(script);
       }, 1);
     });

     return script;
   },

   /**
    * Readystate callback queue
    */
   queue: [],

   /**
    * Ready state
    */
   ready: /loaded|interactive|complete/.test(document.readyState),

   /**
    * Flushes the ready queue when the dom is ready
    */
   flush: function(){
     var cb = SPR.DOM.queue.shift();
     SPR.DOM.ready = true;

     while(cb){
       cb();
       cb = SPR.DOM.queue.shift();
     }
   },

   /**
    * Do something when the dom is ready
    *
    * @param callback {Function} The callback to happen when the dom is ready
    */
   onReady: function(callback){
    if(SPR.DOM.ready){
      SPR.DOM.queue.push(callback);
      SPR.DOM.flush();
    } else {
       //Handle IE
       if (document.documentElement.doScroll){
         if(window.self === window.top){
          // Not sure why this code is needed
           (function(){
             if ( !document.uniqueID && document.expando ) {
               return SPR.DOM.queue.push(callback);
             }

             try {
               document.documentElement.doScroll("left");
               callback();
             } catch(e) {
               setTimeout(arguments.callee, 0);
             }
           })();
         } else {
           SPR.DOM.queue.push(callback);
         }
       } else {
         SPR.DOM.queue.push(callback);
       }
    }
   },

  /**
   * Attaches an event to the DOM
   *
   * @param element  {Object} The element to attach the even to
   * @param event    {String} The name of the even to attach to
   * @param callback {Object} The function to run once the event fires
   *
   * @returns {Object} The elemnt (for chaining)
   */
  attachEvent: function(element, event, callback){
    if (element.addEventListener){
      element.addEventListener(event, callback, false);
    } else {
      element.attachEvent('on' + event, callback);
    }

    return element;
  },

  /**
   * Removes a previously attached an event from a DOM element
   *
   * @param element  {Object} The element to attach the even to
   * @param event    {String} The name of the even to attach to
   * @param callback {Object} The function to run once the event fires
   *
   * @returns {Object} The elemnt (for chaining)
   */
  detachEvent: function(element, event, callback){
    if (element.addEventListener){
      element.removeEventListener(event, callback, false);
    } else {
      element.detachEvent('on' + event, callback);
    }

    return element;
  },

  /**
   * Gets the true Top location of an element
   * @param {Object} element The element to find Y for
   * @returns {Number} The Y coordinate in pixels
   */
  top: function(element){
    if (!element) {
      return 0;
    } else if (element.y){
      return element.y;
    } else {
      return element.offsetTop + SPR.DOM.top(element.offsetParent);
    }
  },

  /**
   * Gets the true Left location of an element
   * @param {Object} element The element to find X for
   * @returns {Number} The X coordinate in pixels
   */
  left: function(element){
    if (!element) {
      return 0;
    } else if (element.x){
      return element.x;
    } else {
      return element.offsetLeft + SPR.DOM.left(element.offsetParent);
    }
  },

  /**
   * Gets the true height of an element
   * @param {Object} element The element to find the height for
   * @returns {Number} The height in pixels
   */
  height: function(element){
    return Math.max(
      (element.scrollHeight || 0), //mozilla,webkit
      (element.offsetHeight || 0), //IE7+
      (element.clientHeight || 0)  //IE6
    );
  },

  /**
   * Gets the true width of an element
   * @param {Object} element The element to find the height for
   * @returns {Number} The height in pixels
   */
  width: function(element){
    return Math.max(
      (element.scrollWidth || 0), //mozilla,webkit
      (element.offsetWidth || 0), //IE7+
      (element.clientWidth || 0)  //IE6
    );
  },

  /**
   * Gets the current scroll position
   */
  scroll: function(){
    var s = 0;

    if (window.pageYOffset){
      //mozilla, webkit, IE8+
      s = window.pageYOffset;
    } else if (document.documentElement){
      //IE6/7
      s = document.documentElement.scrollTop;
    } else {
      s = 0;
    }

    return s;
  },

  /**
   * Gets the visible viewport width and height
   */
  viewport: function(){
     var w = 0, h = 0, de = document.documentElement;

     if (window.innerWidth){
       // the more standards compliant browsers (mozilla/webkit/IE7)
       w = window.innerWidth;
       h = window.innerHeight;
     } else if (de && de.clientWidth) {
       // IE6 in standards compliant mode
       w = de.clientWidth;
       h = de.clientHeight;
     } else {
       var body = SPR.$('BODY')[0];
       w = body.clientWidth;
       h = body.clientHeight;
     }

     return { w:w, h:h };
  },

  getsupportedprop: function getsupportedprop(proparray){
    var root=document.documentElement //reference root element of document
    for (var i=0; i<proparray.length; i++){ //loop through possible properties
      if (typeof root.style[proparray[i]]=="string"){ //if the property value is a string (versus undefined)
          return proparray[i] //return that string
      }
    }
  },

  /**
   * Finds elements by an ID or by a class
   * @param selector {String} The CSS3 Style Selector to query by
   *
   * @returns {Array} An Array of elements found
   *
   * NOTE: TagNames, ID's (#) and Classes (.) are only supported
   */
  $: function(selector){
    var results = [], tags, i = 0, cssClass, name;
    if (!selector){
      return [];
    }

    if (typeof selector !== 'string'){
      return [selector];
    }

    switch (selector.charAt(0)){
      /**
       * The case that handles finding an element by an ID
       */
      case '#' :
        results.push(document.getElementById(selector.substring(1)));
        break;

      /**
       * The case that handles finding an element by class name
       */
      case '.' :
        tags = document.getElementsByTagName('*');
        //borrowed this idea from jQuery's 'hasClass' method
        name = ' ' + selector.substring(1) + ' ';
        for (; i < tags.length; i += 1) {
          cssClass = (' ' + tags[i].className + ' ').replace(/[\n\t\r]/g,' ');

          if (cssClass.indexOf(name) > -1) {
            results.push(tags[i]);
          }
        }
        break;

      /**
       * The case that handles finding an element by TagName
       */
      default: results = document.getElementsByTagName(selector);
    }

    return results;
  }
});/*global SPR noop*/

/**
 * Basic querystring manipulation
 *
 * @requires core/common
 */
SPR.provide('QS', {

  /**
   * Escapes the test for use in the querystring
   *
   * @param string {String} The string to escape
   */
  escape:function(string){
    return encodeURIComponent(string);
  },

  /**
   *  Unescapes a string that has been escaped
   *
   * @param string {String} The string to unescape
   */
  unescape:function(string){
    return decodeURIComponent(string);
  },

  /**
   * Encodes an object into a standard querystring format
   * Supports arrays as well as strings, **DOES NOT SUPPORT OBJECTS**
   *
   * @param params {Object} The object to encode into a querystring
   *
   * With the given object:
   *   {
   *     foo: 'bar',
   *     baz: 123,
   *     qux: ['cat', 'dog', 'bird]
   *   }
   *
   * The resulting string will be:
   *   foo=bar&baz=123&qux=cat&qux=dog&qux=bird
   */
  encode:function(params, prefix){
    var qs = SPR.QS,
        items = [];

    if (SPR.Common.isArray(params)) {
      // Serialize array item.
      var i = 0, v;
      for (; i < params.length; i += 1){
        v = params[i];

        if (/\[\]$/.test(prefix)){
          // Treat each array item as a scalar.
          items.push(qs.escape(prefix) + '=' + qs.escape(v));
        } else {
          // If array item is non-scalar (array or object), encode its
          // numeric index to resolve deserialization ambiguity issues.
          // Note that rack (as of 1.0.0) can't currently deserialize
          // nested arrays properly, and attempting to do so may cause
          // a server error. Possible fixes are to modify rack's
          // deserialization algorithm or to provide an option or flag
          // to force array serialization to be shallow.
          items.push(qs.encode(v, prefix + '[' + ( typeof v === ('object' || SPR.Common.isArray(v)) ? i : '' ) + ']'));
        }
      }
    //check if it's an object and it is not a dom element
    } else if (typeof params === 'object' && params !== null && !('nodeType' in params)){
      // Serialize object item.
      var name;

      for (name in params){
        if (Object.prototype.hasOwnProperty.call(params, name)){
          if (prefix){
            items.push(qs.encode(params[name], prefix + '[' + name + ']'));
          } else {
            items.push(qs.encode(params[name], name));
          }
        }
      }

    } else {
      // Serialize scalar item.
      items.push(qs.escape(prefix) + '=' +  qs.escape(params));
    }

    return items.join('&');
  },

  /**
   * Decodes a standard querystring into an object
   *
   * @param qs {String} The querystring to decode
   */
  decode:function(qs){
    var obj = {}, j = 0,
      coerce_types = { 'true': !0, 'false': !1, 'null': null },
      params = qs.replace( /\+/g, ' ' ).split( '&' );

    for (; j < params.length; j += 1){

      var v = params[j],
          param = v.split( '=' ),
          key = SPR.QS.unescape( param[0] ),
          val,
          cur = obj,
          i = 0,

        // If key is more complex than 'foo', like 'a[]' or 'a[b][c]', split it
        // into its component parts.
        keys = key.split( '][' ),
        keys_last = keys.length - 1;

      // If the first keys part contains [ and the last ends with ], then []
      // are correctly balanced.
      if ( /\[/.test( keys[0] ) && /\]$/.test( keys[ keys_last ] ) ) {
        // Remove the trailing ] from the last keys part.
        keys[ keys_last ] = keys[ keys_last ].replace( /\]$/, '' );

        // Split first keys part into two parts on the [ and add them back onto
        // the beginning of the keys array.
        keys = keys.shift().split('[').concat( keys );

        keys_last = keys.length - 1;
      } else {
        // Basic 'foo' style key.
        keys_last = 0;
      }

      // Are we dealing with a name=value pair, or just a name?
      if ( param.length === 2 ) {
        val = SPR.QS.unescape( param[1] );

        // Coerce values.
        val = val && !isNaN(val)            ? +val              // number
          : val === 'undefined'             ? undefined         // undefined
          : coerce_types[val] !== undefined ? coerce_types[val] // true, false, null
          : val;                                                // string

        if ( keys_last ) {
          // Complex key, build deep object structure based on a few rules:
          // * The 'cur' pointer starts at the object top-level.
          // * [] = array push (n is set to array length), [n] = array if n is
          //   numeric, otherwise object.
          // * If at the last keys part, set the value.
          // * For each keys part, if the current level is undefined create an
          //   object or array based on the type of the next keys part.
          // * Move the 'cur' pointer to the next level.
          // * Rinse & repeat.
          for ( ; i <= keys_last; i += 1 ) {
            key = keys[i] === '' ? cur.length : keys[i];
            cur = cur[key] = i < keys_last ? cur[key] || ( keys[i+1] && isNaN( keys[i+1] ) ? {} : [] ) : val;
          }

        } else {
          // Simple key, even simpler rules, since only scalars and shallow
          // arrays are allowed.

          if ( SPR.Common.isArray( obj[key] ) ) {
            // val is already an array, so push on the next value.
            obj[key].push( val );

          } else if ( obj[key] !== undefined ) {
            // val isn't an array, but since a second value has been specified,
            // convert val into an array.
            obj[key] = [ obj[key], val ];

          } else {
            // val is a scalar.
            obj[key] = val;
          }
        }

      } else if ( key ) {
        // No value was defined, so set something meaningful.
        obj[key] = undefined;
      }
    }
    return obj;
  }
});/*global SPR noop*/

/**
 * Communication with the SimpleReach API happens here
 *
 * @requires core/common
 * @requires core/qs
 * @requires core/dom
 */
SPR.provide('API', {
  /**
   * Holds our callbacks for jsonp requests
   */
  callbacks: {},

  /**
   * Makes a JSONp call to the simplereach servers
   * Uses the browser's current protocol, currently we only support GET requests
   *
   * @param {String} domain The domain to send the request to
   * @param {String} path The path to send the request
   * @param {Object} params The parameters to send to the service
   * @param {Function} callback method to perform
   * @param {callbackParamName} the name of the callback parameter, defaults to 'cb' if not supplied
   */
  jsonp: function(domain, path, params, callback, callbackParamName){
    callback = callback || noop;
    // default callback parameter name to 'cb'
    if(!callbackParamName) {
      callbackParamName = 'cb';
    }

    //a random number to keep from colliding callbacks
    var rnd = 'cb' + SPR.Common.random(),
        api = SPR.API;

    //specify callback method for the server returning the request
    // params.cb = 'SPR.API.callbacks[' + rnd + ']';
    params[callbackParamName] = 'SPR.API.callbacks.' + rnd;

    //we use the browser's protocol to prevent from SSL errors
    var protocol = document.location.protocol + '//';

    if(protocol === 'file://') {
      protocol = 'http://';
    }

    var query = SPR.QS.encode(params),
        script = SPR.DOM.addScript(protocol + domain + path + '?' + query);

    /**
     * Dispatch the callback then remove the script tag from the head
     * and remove the reference to the callback
     */
    api.callbacks[rnd] = function(response){
      /**
       * FIX: The setTimeout here is to fix an odd issue that causes ie6 to crash
       * see: http://terenceyim.wordpress.com/2007/10/09/javascript-that-crashes-ie/
       */
      setTimeout(function(){
        script.parentNode.removeChild(script);
      }, 0);

      callback(response);

      //if we can't delete the object the just set it to null
      try{
        delete api.callbacks[rnd];
      } catch(e) {
        api.callbacks[rnd] = null;
      }
    };
  }
});/*global SPR noop*/

/**
 * Initialization for 'DE', Includes communication with the API
 * well as managing animation and cross-frame communications
 *
 * @requires core/api
 * @requires core/qs
 */
SPR.provide('de', {
  api:    'feeds.delicious.com',
  apiPath: '/v2/json/urlinfo/data',

  collect: function(options) {
    var de = SPR.de,
        config = SPR.Reach.config;

    SPR.API.jsonp(de.api, de.apiPath, {'url': options.url}, function(params){
      SPR.API.jsonp('cc.simplereach.com', '/event', { event:'s', url:options.url, cid:options.id, pid:options.pid, sn:'de', data:params });
    }, 'callback');
  }
});/*global SPR noop*/

/**
 * Initialization for 'dg', Includes communication with the API
 * well as managing animation and cross-frame communications
 *
 * @requires core/api
 * @requires core/qs
 */
SPR.provide('dg', {
  api:    'services.digg.com',
  apiPath: '/stories/',

  collect: function(options){
    var dg = SPR.dg,
        config = SPR.Reach.config;

    // callback is required but not handed back as jsonp
    SPR.API.jsonp(dg.api, dg.apiPath, {'type': 'javascript', 'link': options.url}, function(params){
      SPR.API.jsonp('cc.simplereach.com', '/event', { event:'s', url:options.url, cid:options.id, pid:options.pid, sn:'dg', data:params });
    }, 'callback');
  }
});/*global SPR noop*/

/**
 * Initialization for 'fb', Includes communication with the API
 * well as managing animation and cross-frame communications
 *
 * @requires core/api
 * @requires core/qs
 */
SPR.provide('fb', {
  api:    'graph.facebook.com',
  apiPath: '/fql',

  collect: function(options) {
    var fb = SPR.fb,
        config = SPR.Reach.config;

    // TODO: need to add url_variants
    SPR.API.jsonp(fb.api, fb.apiPath, {'q': 'SELECT url,total_count,share_count,comment_count,like_count,click_count,commentsbox_count FROM link_stat WHERE url in ("' + options.url + '")'}, function(params){
      SPR.API.jsonp('cc.simplereach.com', '/event', { event:'s', url:options.url, cid:options.id, pid:options.pid, sn:'fb', data:params });
    }, 'callback');
  }
});/*global SPR noop*/

/**
 * Initialization for 'gp', Includes communication with the API
 * well as managing animation and cross-frame communications
 *
 * @requires core/api
 * @requires core/qs
 */
SPR.provide('gp', {
  // https
  api:    'clients6.google.com',
  apiPath: 'rpc',

  /*
  url = @content['url']
  data = '[{"method":"pos.plusones.get","id":"p","params":{"nolog":true,"id":"'+url+'","source":"widget","userId":"@viewer","groupId":"@self"},"jsonrpc":"2.0","key":"p","apiVersion":"v1"}]'

  response = Typhoeus::Request.post(api_url,
    :body => data,
    :method   => :post,
    :headers  => {'Content-type' => 'application/json'}
  )
  */

  collect: function(options){
    var gp = SPR.gp,
        data = '',
        config = SPR.Reach.config;

    data = '[{"method":"pos.plusones.get","id":"p","params":{"nolog":true,"id":"'+options.url+'","source":"widget","userId":"@viewer","groupId":"@self"},"jsonrpc":"2.0","key":"p","apiVersion":"v1"}]';

    // 'key': 'AIzaSyCKSbrvQasunBoV16zDH9R33D88CeLr9gQ',
    // SPR.API.jsonp(gp.api, gp.apiPath, {'data': data}, function(params){
    //   console.log(params);
    //   SPR.API.jsonp('cc.simplereach.com', '/event', { event:'s', url:config.url, cid:options.id, pid:config.pid, sn:'gp', data:params });
    // });
  }
});/*global SPR noop*/

/**
 * Initialization for 'li', Includes communication with the API
 * well as managing animation and cross-frame communications
 *
 * @requires core/api
 * @requires core/qs
 */
SPR.provide('li', {
  api:    'www.linkedin.com',
  apiPath: '/countserv/count/share',

  collect: function(options){
    var li = SPR.li,
        config = SPR.Reach.config;

    // Returns partial JSONP specific to LI's button
    SPR.API.jsonp(li.api, li.apiPath, {'url': options.url}, function(params){
      SPR.API.jsonp('cc.simplereach.com', '/event', { event:'s', url:options.url, cid:options.id, pid:options.pid, sn:'li', data:params });
    }, 'callback');
  }
});/*global SPR noop*/

/**
 * Initialization for 'rd', Includes communication with the API
 * well as managing animation and cross-frame communications
 *
 * @requires core/api
 * @requires core/qs
 */
SPR.provide('rd', {
  api:    'www.reddit.com',
  apiPath: '/api/info.json',

  collect: function(options){
    var rd = SPR.rd,
        config = SPR.Reach.config;

    SPR.API.jsonp(rd.api, rd.apiPath, {'url': options.url}, function(params){
      SPR.API.jsonp('cc.simplereach.com', '/event', { event:'s', url:options.url, cid:options.id, pid:options.pid, sn:'rd', data:params });
    }, 'jsonp');
  }
});/*global SPR noop*/

/**
 * Initialization for 'pi', Includes communication with the API
 * well as managing animation and cross-frame communications
 *
 * @requires core/api
 * @requires core/qs
 */
SPR.provide('pi', {
  api:    'partners-api.pinterest.com',
  apiPath: '/v1/urls/count.json',

  collect: function(options){
    var pi = SPR.pi,
        config = SPR.Reach.config;

    // Returns partial JSONP specific to PI's button
    SPR.API.jsonp(pi.api, pi.apiPath, {'url': options.url}, function(params){
      SPR.API.jsonp('cc.simplereach.com', '/event', { event:'s', url:options.url, cid:options.id, pid:options.pid, sn:'pi', data:params });
    }, 'callback');
  }
});
/*global SPR noop*/

/**
 * Initialization for 'su', Includes communication with the API
 * well as managing animation and cross-frame communications
 *
 * @requires core/api
 * @requires core/qs
 */
SPR.provide('su', {
  api:    'www.stumbleupon.com',
  apiPath: '/services/1.01/badge.getinfo',

  collect: function(options){
    var su = SPR.su,
        config = SPR.Reach.config;

    // not sure what the callback param is
    SPR.API.jsonp(su.api, su.apiPath, {'url': options.url}, function(params){
      SPR.API.jsonp('cc.simplereach.com', '/event', { event:'s', url:options.url, cid:options.id, pid:options.pid, sn:'su', data:params });
    });
  }
});/*global SPR noop*/

/**
 * Initialization for 'tw', Includes communication with the API
 * well as managing animation and cross-frame communications
 *
 * @requires core/api
 * @requires core/qs
 */
SPR.provide('tw', {
  api:    'urls.api.twitter.com',
  apiPath: '/1/urls/count.json',

  collect: function(options){
    var tw = SPR.tw,
        config = SPR.Reach.config;

    SPR.API.jsonp(tw.api, tw.apiPath, {'url': options.url}, function(params){
      SPR.API.jsonp('cc.simplereach.com', '/event', { event:'s', url:options.url, cid:options.id, pid:options.pid, sn:'tw', data:params });
    }, 'callback');
  }
});/*global SPR noop*/

/**
 * Initialization for 'Reach', Includes communication with the API
 * well as managing animation and cross-frame communications
 *
 * @requires core/api
 * @requires core/qs
 */
SPR.provide('Reach', {
  api:    'cc.simplereach.com',
  cdn:    'd8rk54i4mohrb.cloudfront.net',
  // config: window.__reach_config || window.__spr_config,
  config: {},

  init:function(){
    //if we are on the cdn then we are the slide and do not log analytics
    if (window.location.host === SPR.Reach.cdn){
      return;
    }

    try{
      var reach = SPR.Reach,
          oldConfig = window.__reach_config || window.__spr_config,
          config = reach.config || {};

      for (var key in oldConfig) {
        if (config[key] === undefined) {
          config[key] = oldConfig[key];
        }
      }

      //backwards compat with The Slide
      if(config.ckw){
        config.tags = config.ckw.split(' ');
      }
      //backwards compat with The Slide
      if(config.pub){
        config.date = config.pub;
      }
      //backwards compat with The Slide
      if(config.cat){
        config.channels = config.cat.split(' ');
      }

      if(config.no_slide === true || config.no_slide === 1){
        config.slide_active = false;
      }

      reach.config = config;
      reach.collect(config);
    } catch(e){
      SPR.DOM.onReady(function(){
        var img = document.createElement("img");
        img.src="http://cc.simplereach.com/pixel?bad=true&error=" + e.message;
        img.setAttribute("width", "1px");
        document.body.appendChild(img);
      });
    }
  },

  collect: function(params){
    var reach = SPR.Reach,
        options = {};

    function createList(param){
      if (typeof param === 'string'){
        param = param.split(',');
      }

      if (SPR.Common.isArray(param)){
        var i = 0;
        for (; i < param.length; i += 1){
          if(typeof param[i] === 'string'){
            param[i] = param[i].replace(/^\s*/, '').replace(/\s*$/, '').replace(/\|/, '');
          }
        }

        return param.join('|');
      } else {
        return param;
      }
    }

    options.pid = params.pid;
    options.url = params.url;
    options.title = params.title;
    options.date = params.date;
    options.domain = params.domain;
    options.ref_url = params.ref_url;
    options.referrer = document.referrer;

    if(params.authors){
      options.authors = createList(params.authors);
    }

    if(params.channels){
      options.channels = createList(params.channels);
    }

    if(params.tags){
      options.tags = createList(params.tags);
    }

    if(params.brand_tags){
      options.brand_tags = createList(params.brand_tags);
    }

    if (params.date && typeof params.date !== 'string'){
      options.date = params.date.toString();
    }

    if (!options.pid || !options.url || !options.date){
      if(params.ignore_errors){
        return;
      }

      try{
        console.log('SPR-ERROR: Please provide pid, url and date in the configuration');
      } catch(e){}
      return;
    }

    //if we detect it is encoded, try to decode it
    if(options.url.indexOf('http%3') === 0){
      try{
        options.url = decodeURIComponent(options.url);
      } catch(e){
        options.url = unescape(options.url);
      }
    }

    //set it to the original one
    params.url = options.url;

    SPR.API.jsonp(reach.api, '/n', options, function(params){
      if(params.slide !== false){
        var showSlide = false;

        if(reach.config.slide_active === true){
          showSlide = true;
        } else {
          if(reach.config.slide_active !== false && params.slide === true){
            showSlide = true;
          }
        }

        if(SPR.Slide && showSlide === true && SPR.Slide.enabled === false){
          SPR.Slide.enable(params.id);
        }
      }

      if(params.de) {
        SPR.de.collect(params);
      }
      if(params.dg) {
        SPR.dg.collect(params);
      }
      if(params.fb) {
        SPR.fb.collect(params);
      }
      if(params.gp) {
        SPR.gp.collect(params);
      }
      if(params.li) {
        SPR.li.collect(params);
      }
      if(params.rd) {
        SPR.rd.collect(params);
      }
      if(params.su) {
        SPR.su.collect(params);
      }
      if(params.tw) {
        SPR.tw.collect(params);
      }
      if(params.pi) {
        SPR.pi.collect(params);
      }
    });
  }
});})(window, document, function(){});
