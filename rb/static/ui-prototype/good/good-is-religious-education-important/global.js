(function () {
	var $html = $('html'),
		fontFaceClass;

	$html.addClass('js');

	// Allow custom styles for users with narrower screens.
	if (screen.availWidth < 1110) {
		$html.addClass('narrow');
	}

	// If Firefox 3.5+, hide content till load (or 3 seconds) to prevent FOUT
	if (document.documentElement.style.MozTransform === '') { // gecko 1.9.1 inference
		fontFaceClass = 'hide-custom-font-face';
		$html.addClass(fontFaceClass);
		setTimeout(function () {
			$html.removeClass(fontFaceClass);
		}, 500);
	}
}( ));

// GOOD written functions that have global reach go here
Date.prototype.lastSunday = function () {
	var dateOnSundayWithTime = new Date(this.getTime() - (this.getDay() * 24 * 60 * 60 * 1000 ));
	return new Date(dateOnSundayWithTime.getFullYear(), dateOnSundayWithTime.getMonth(), dateOnSundayWithTime.getDate() );
};

Date.prototype.dateOnlyString = function () {
	return (this.getMonth() + 1 ) + "/" + this.getDate() + "/" + this.getFullYear();
};


function JSKitCommentsCountFilter(count) {
	if (count > 0)
		return count;
	else
		return '+';
}


var analytics = 
{

    uid : function()
    {
        var uid = this.getCookie();
        if( uid == null || uid == '' )
        {
            uid = this.setCookie();
        }

        return uid;
    },
    
    buildNewUID : function()
    {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    },

    getCookie : function()
    {
        return GOOD.readCookie( 'random_uid' );
    },
    
    setCookie : function()
    {
        var uid = this.buildNewUID();
		    GOOD.writeCookie( 'random_uid', uid, 900 );
        return uid;
    }

};

function resetText (id,text) {
	if ($(id).val() === '') {
		$(id).val(text);
	}
}

function clearForm (id, value) {
	if ($(id).val() === value) {
		$(id).val('');
	}
}

//////////////////////////
// Create the GOOD namespace
//////////////////////////

var GOOD = {
    cache_buster: 0,

	// A flag for testing DOM-readiness
	domReady: (function () { $(function () { GOOD.domReady = true; }); return false; })( ),

	// Returns a new copy of an object (not a reference)
	beget: function (o) {
		var F = function () {};
		F.prototype = o;
		return new F();
	},

	reloadAllAdsOnPage: function () {
		var self = this;
		$('iframe.vendor_ad').each(function () {
			var original_source = $(this).attr("src");
			original_source = original_source.replace( /&cache_buster=[0-9]*/i, '' ) + "&cache_buster=" + self.cache_buster;
			self.cache_buster += 1;
			$(this).attr({
				src: original_source
			});
		});
		return false;
	},

  isValidEmail : function( email )
  {
    return email.match( /^[a-z0-9!#$%&\'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&\'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9][-a-z0-9]*\.)*(?:[a-z0-9][-a-z0-9]{0,62})\.(?:(?:[a-z]{2}\.)?[a-z]{2,4}|museum|travel)$/i );
    return false;
  },

	writeCookie: function (name, value, days, path) {
		var date = new Date(), expiry;

    if( days )
    {
      date.setTime(date.getTime() + days * 8.64e7);
		  expiry = date.toUTCString();
    } else
    {
      expiry = '';
    }

		path = path || '/';
		document.cookie = [name + '=' + value, 'expires=' + expiry, 'path=' + path].join('; ');
		return this.readCookie(name);
	},

	readCookie: function (name) {
		var nameEQ = name + "=",
			ca = document.cookie.split(';'),
			c;

		for (var i=0; i<ca.length; i++) {
			c = ca[i];

			if (c.charAt(0) === ' ') {
				c = c.substring(1,c.length);
			}

			if (c.indexOf(nameEQ) === 0) {
				return unescape(c.substring(nameEQ.length,c.length));
			}
		}

		return null;
	},

	deleteCookie: function (name) {
		return this.writeCookie(name, '', -1);
	},

	user: function() {
		var cookie = this.readCookie('CakeCookie[good_cookies]'),
			user;

		if (cookie) {
			cookie = cookie.split('|');
			user = {
				link: '/community/' + cookie[0],
				name: cookie[1] && cookie[1].replace('+',' '),
				image: cookie[2] || 'http://resource.cloudfront.goodinc.com/v11/images/defaults/avatar30.jpg',
				fb: cookie[3] > 0,
				access: cookie[4] && cookie[4] === '1'
			};
		} else {
			user = false;
		}

		return user;
	},

	// Helper method for calling ui.dialog and referencing already-open dialogs
	// The options parameter can be used to override default UI dialog options.
	// Additionally, options can accept the following non-UI properties:
	//	url: Sets the url for the $.load request (default: event's target.href)
	//	html: The selector that queries or creates the $dialog jQuery object (default: '<div/>')
	dialog: function (selector, options) {
		var $dialog = $(options && options.html || '<div/>');

		function open(url, config) {
			if (url) {
				$.ajax({
					url: url,
					success: function (html) {
						var $html = $(html);
						$(function () {
							GOOD.form.animateAndReplace($dialog.children(), $html, {
								hide: ($.support.opacity) ? ['puff', { percent:100 }, 200] : ['slide', {}, 0] ,
								show: ['slide', { direction:'up' }, 200],
								after: function ($old, $new) {
									var $dialogContainer = GOOD.form.getAncestor($new, '.ui-dialog');
									$dialogContainer.animate(
										{ top:($(document).scrollTop() + ($(window).height() - $dialogContainer.outerHeight()) / 2) },
										{
											duration: 100,
											complete: function () {
												$dialog.dialog('option', 'position', 'center');
											}
										}
									);
								}
							});
						});
					}
				});
				$dialog.html('<div class="loading"/>');
			}

			$dialog
				.bind('dialogclose', function () {
					$(this).dialog('destroy').remove();
				})
				.dialog(config)
				// Add a title attribute to the close button for added accessibilty
				.parent()
					.find('.ui-dialog-titlebar-close')
						.attr('title', 'Click here to close this box')
						.end()
					.end()
				.dialog('open');
		}

		// Extend dialog defaults with any specified options
		options = $.extend({
			autoOpen: false,
			bgiframe: true,
			iframe: false,
			modal: true,
			resizable: false,
			closeText: '',
			closeOnEscape: true,
			width: 600
		}, options);

		if (selector) {
			$(selector).each(function (i) {
				options.title = options.title || this.title;
				$(this).unbind().click(function (e) {
					e.preventDefault();
					open(options.url || this.href, options);
				});
			});
		} else {
			open(options.url, options);
		}

		return $dialog;
	},

	// Helper funciton for calling a login dialog and handling any interrupted actions
	login: function (postId) {
		GOOD.dialog(null, {
			url:'/login' + ('/' + postId || ''),
			title:'Sign in to GOOD'
		});
	},

	// Checks for an existing association b/w Facebook and GOOD user account
	facebookLogin: function () 
	{	
		FB.login(function(response) 
		{
			if (response.session) 
			{
				var fbuid = response.session.uid;
				FB.api('/me', function(response) 
				{
					var first_name = response.first_name;
					var last_name = response.last_name;
					var picture = "http://graph.facebook.com/" + fbuid + "/picture";
					$.ajax({
						type: "GET",
						url: "/users/facebook_login",
						data: "last_name=" + last_name + "&first_name=" + first_name + "&fbuid=" + fbuid + "&picture=" + picture,
						success: function(msg)
						{
							window.location.reload();
						}
					});
				});
			} else {
				window.location.reload();
			}
		});    
	},

	// Populate profileArea	(called within page)
	populateProfile: function ($profile) {
		var user = this.user(),
			$loggedInBox = $('\
				<div class="you">\
					<a class="profile-link polaroid"><img class="profile-image" /></a>\
					<ul>\
						<li><a class="profile-link">Profile</a></li>\
						<li><a href="/users/edit">Edit Settings</a></li>\
						<li class="signout"><a href="/logout">Signout</a></li>\
					</ul>\
				</div>');
		
		if (user && user.access) {
			$loggedInBox
				.find('li')
				.eq(1)
				.after('\
					<li><a href="/goodadmin/posts/edit">Create a Post</a></li>\
					<li><a href="/goodadmin/posts/new_job">New Job Listing</a></li>\
					<li><a href="/goodadmin/posts/new_press">New Press Release</a></li>\
					<li><a href="/goodadmin/posts">Admin</a></li>\
				');
		}

		if (user) {
			$profile.empty();

			$loggedInBox
				.find('.profile-link')
					.attr('href', user.link)
					.end()
				.find('.profile-image')
					.attr({
						'src': user.image,
						'alt': user.name,
						'title': user.name
					});

			if (user.fb) {
				$loggedInBox
					.find('[href="/logout"]').click(
					  function (e) 
            {
						  e.preventDefault();
						  FB.logout(function () 
                                {
							                    window.location='/logout';
						                    });
					}
				);
			}


			$profile
				.append($loggedInBox)
				.removeClass('not-logged-in')
				.addClass('logged-in');

		} else {

//			GOOD.dialog($profile.find('a[href=/login], a[href=/users/signup]'));

		}

		$profile.show();
	},

	loadScript: function (src, callback) {
		var referenceElement, script;
		if (typeof callback === 'function') {
			$.getScript(src, callback);
		} else {
			referenceElement = document.getElementsByTagName('script')[0];
			script = document.createElement('script');
			script.type = 'text/javascript';
			script.async = true;
			script.src = src;
			referenceElement.parentNode.insertBefore(script, referenceElement);
		}
	}

};
