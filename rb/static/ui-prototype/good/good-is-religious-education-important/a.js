var Mint = new Object();
Mint.save = function() 
{
	var now		= new Date();
	var debug	= false; // this is set by php 
	if (window.location.hash == '#Mint:Debug') { debug = true; };
	var path	= 'http://mint.good.is/?record&key=7159525a303057453232363348696349424c7a37304e3331';
	path 		= path.replace(/^https?:/, window.location.protocol);
	
	// Loop through the different plug-ins to assemble the query string
	for (var developer in this) 
	{
		for (var plugin in this[developer]) 
		{
			if (this[developer][plugin] && this[developer][plugin].onsave) 
			{
				path += this[developer][plugin].onsave();
			};
		};
	};
	// Slap the current time on there to prevent caching on subsequent page views in a few browsers
	path += '&'+now.getTime();
	
	// Redirect to the debug page
	if (debug) { window.open(path+'&debug&errors', 'MintLiveDebug'+now.getTime()); return; };
	
	var ie = /*@cc_on!@*/0;
	if (!ie && document.getElementsByTagName && (document.createElementNS || document.createElement))
	{
		var tag = (document.createElementNS) ? document.createElementNS('http://www.w3.org/1999/xhtml', 'script') : document.createElement('script');
		tag.type = 'text/javascript';
		tag.src = path + '&serve_js';
		document.getElementsByTagName('head')[0].appendChild(tag);
	}
	else if (document.write)
	{
		document.write('<' + 'script type="text/javascript" src="' + path + '&amp;serve_js"><' + '/script>');
	};
};
if (!Mint.SI) { Mint.SI = new Object(); }
Mint.SI.Referrer = 
{
	onsave	: function() 
	{
		var encoded = 0;
		if (typeof Mint_SI_DocumentTitle == 'undefined') { Mint_SI_DocumentTitle = document.title; }
		else { encoded = 1; };
		var referer		= (window.decodeURI)?window.decodeURI(document.referrer):document.referrer;
		var resource	= (window.decodeURI)?window.decodeURI(document.URL):document.URL;
		return '&referer=' + escape(referer) + '&resource=' + escape(resource) + '&resource_title=' + escape(Mint_SI_DocumentTitle) + '&resource_title_encoded=' + encoded;
	}
};
    if (!Mint.GOOD) { Mint.GOOD = new Object(); }
    Mint.GOOD.AuthorAnalytics = 
    {
        onsave: function()
        {
            var uid = analytics.uid();
            var user_id = '';
            if( GOOD.user() )
            {
                user_id = GOOD.user()['name'];
            }
            return '&uid=' + escape(uid) + '&user_id=' + escape(user_id);
        }
    };
if (!Mint.TT) { Mint.TT = new Object(); }
Mint.TT.behavior = 
{
	getURL	: function(eventName,ajaxURL)
  {
		  w = window;
      var uid = analytics.uid();
		  var sourceURL = (w.decodeURI)?w.decodeURI(document.URL):document.URL;
		  url = this.API_URL+"?eventName="+escape(eventName)+"&sourceURL="+escape(sourceURL) + "&uid=" +escape(uid);
		  if(ajaxURL) url+="&ajaxURL="+escape(ajaxURL);
		  return url;
	},
	record	: function(eventName,ajaxURL)
  {
		  url = this.getURL(eventName,ajaxURL);
		  w=window;
		  if(w.XMLHttpRequest)r=new XMLHttpRequest();
		  else if(w.ActiveXObject)r=new ActiveXObject("Microsoft.XMLHTTP");
		  if(r)
      {
			  r.open("GET", url, true);
  	  	r.send();
		  }
	},	
	API_URL: 'http://mint.good.is'
};
 Mint.TT.behavior.API_URL='http://mint.good.is/pepper/good/behavior/api.php' 
Mint.save();