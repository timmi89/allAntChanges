//////////////////////////
// Add methods to GOOD
//////////////////////////
$.extend(GOOD, {

	form: {

		// Validate a form input or a string (work in progress)
		validate: function (field, type) {
			var regex = {
					email: /^([a-z0-9!#$%&'*+\/=?\^_`{|}~\-]+(?:\.[a-z0-9!#$%&'*+\/=?\^_`{|}~\-]+)*)@(?:[a-z0-9](?:[a-z0-9\-]*[a-z0-9])?\.)+(?:[a-z]{2,4}|museum|travel)$/i
				},
				value, required, message;

			if (typeof field === 'string') {
				value = field;
			} else if (field.jquery) {
				value = field.val();
				required = field.hasClass('required');
			} else if (field.value) {
				value = field.value;
				required = /\brequired\b/.test(field.className);
			}

			if (regex[type].test(value)) {
				message = 'valid';
			} else if (value === '') {
				message = 'You forgot to enter a' + ((/[aeiou]/.test(type)) ? 'n ' : ' ') + type;
			} else {
				message = 'Please enter a valid ' + type;
			}

			return message;
		},

		// Replaces a form with its confirmation message
		confirm: function (selector, message, callback) {
			var $form = $(selector),
				options = { after: callback };
			GOOD.form.animateAndReplace($form, '<h4>' + message + '</h4>', options);
		},

/**
 * error
 * Injects an error message into a standard HTML element
 *
 * @param mixed selector Any valid jQuery selector representing the present form
 */
		error: function (selector, messages, callback) {
			var $form = $(selector),
				$error = $form.find('.form_error'),
				$list = $('<ul/>'),
				message, field;

			if (!$error.length) {
				$error = $('<div class="form_error"/>')
					.prependTo($form)
					.append('<span/>');
			}

			if (typeof messages === 'object') {
				for (field in messages) {
					if (messages.hasOwnProperty(field)) {
						message = messages[field];
						$list.append('<li class="error-message ' + field +'">' + message + '</li>');
					}
				}
			} else {
				$list.append('<li class="error-message">' + messages + '</li>');
			}

			GOOD.form.animateAndReplace($error.children(), $list, {
				show: ['slide', { direction:'up' }, 300]
			});
		},

/**
 * disable
 * Adds a 'disabled' class to a form and then disables and blurs all fields within
 *
 * @param mixed selector Any valid jQuery selector representing the form to be disabled
 */
		disable: function (selector) {
			$(selector).each(function () {
				var $this = $(this);
				if ($this.is('form')) {
					$this
						.addClass('disabled')
						.find(':input').attr('disabled', 'disabled').blur();
				} else if ($this.is(':input')) {
					$this.attr('disabled', 'disabled');
				}
			});
		},

/**
 * enable
 * Removes a 'disabled' class from a form and then unsets any disabled attributes from all fields within
 *
 * @param mixed selector Any valid jQuery selector representing the form to be disabled
 */
		enable: function (selector) {
			$(selector).each(function () {
				var $this = $(this);
				if ($this.is('form')) {
					$this
						.removeClass('disabled')
						.find(':input').removeAttr('disabled').not(':hidden').filter(':first').focus();
				} else if ($this.is(':input')) {
					$this.removeAttr('disabled');
				}
			});
		},

/**
 * ajaxSubmit
 *
 * @param mixed selector Any valid jQuery selector representing the form to be sent/disabled
 */
		ajaxSubmit: function (selector, options) {
			var $form = $(selector),
				form = $form[0],
				config = {
					type: form.method,
					url: form.action,
					data: $form.serialize(),
					dataType: 'json'
				};

			GOOD.form.disable($form);

			if ($.isFunction(options.complete)) {
				options.complete = function (XMLHttpRequest, textStatus) {
					options.complete.call(config, XMLHttpRequest, textStatus);
					GOOD.form.enable($form);
				};
			} else {
				options.complete = function () {
					GOOD.form.enable($form);
				};
			}

			$.extend(config, options);
			return $.ajax(config);
		},

/**
 * ajaxLink
 *
 * @param mixed selector Any valid jQuery selector representing the form to be sent/disabled
 */
		ajaxLink: function (a, options, enable) {
			var $a = $(a),
				config = {
					url: a.href,
					dataType: 'html'
				};

			if ($a.hasClass('disabled')) {
				return false;
			}

			$a.addClass('disabled loading');

			if ($.isFunction(options.complete)) {
				options.complete = function (XMLHttpRequest, textStatus) {
					$a.removeClass('loading');
					options.complete.call(config, XMLHttpRequest, textStatus);
					if (enable) {
						$a.removeClass('disabled');
					}
				};
			} else {
				options.complete = function () {
					$a.removeClass('loading');
					if (enable) {
						$a.removeClass('disabled');
					}
				};
			}

			$.extend(config, options);
			return $.ajax(config);
		},

		getAncestor: function (selector, expr) {
			var $parents = $(selector).parents(),
				i;
			for (i=0; i<$parents.length; i++) {
				if ($parents.eq(i).is(expr)) {
					return $parents.eq(i);
				}
			}
			return false;
		},

		isChildOf: function (selector, expr) {
			var $parents = $(selector).parents(),
				i;
			for (i=0; i<$parents.length; i++) {
				if ($parents.eq(i).is(expr)) {
					return true;
				}
			}
			return false;
        },

		getDialog: function (selector) {
			return GOOD.form.getAncestor(selector, '.ui-dialog-content');
		},

		isInDialog: function (selector) {
			return GOOD.form.isChildOf(selector, '.ui-dialog-content');
		},

/**
 * animateAndReplace
 *
 * @param selector (mixed) A valid jQuery selector (of maybe any element?)
 * @param options (object) A list of configuration options:
 *		- setup (function) A callback invoked prior to replacement.
 *		- complete (function) A callback invoked after replacement has been made and revealed
 * @return void
 * @access public
 */
		animateAndReplace: function (oldSelector, newSelector, options) {
			var $old = $(oldSelector),
				$new = $(newSelector),
				$container = $old.wrapAll('<div/>').parent(),
				$placeholder = $container.wrapAll('<div/>').parent();

			function afterReveal() {
				$placeholder.replaceWith($new);
				options.after.call(this, $old, $new);
			}

			function afterHide() {
				var $clone = $new.not('script').find('script').remove();
				options.before.call(this, $old, $new);
				$container.empty().append($clone);
				$container.show.apply($container, options.show);
				$placeholder.animate({ height:$container.height() }, 200, afterReveal);
			}

			options = $.extend({
				before: function () {},
				after: function () {},
				hide: ['slide', { direction:'left' }, 200 ],
				show: ['slide', { direction:'right' }, 200 ]
			}, options);

			options.hide.push(afterHide);

			$placeholder.css({ height:$placeholder.height(), overflow:'hidden' });
			$container.hide.apply($container, options.hide);
		},

/**
 * initForm
 * Initializes a GOOD form
 *
 * @param mixed selector A valid jQuery selector of the form
 * @return void
 * @access public
 */
		initForm: function (selector, options) {
			var $form = $(selector);

			options = options || {};

			options.formSuccess = options.formSuccess || function (json) {
				GOOD.form.confirm($form, json.message, options.success);
			};

			options.formError = options.formError || function (json) {
				GOOD.form.enable($form);
				GOOD.form.error($form, (json.errors) ? json.errors : json.message, options.error);
			};

			$form.submit(function (e) {

				e.preventDefault();

				$form.addClass('submitting');

				GOOD.form.ajaxSubmit(this, {
					success: function (json, status) {
						if (json.success) {
							options.formSuccess.call($form, json);
						} else {
							options.formError.call($form, json);
						}
					},
					complete: function () {
						$form.removeClass('submitting');
					}
				});
			});

			// Timeout needed to select input element in a form being animated into page
			setTimeout(function () {
				$form.find(':text').eq(0).focus();
			}, 300);
		},

/**
 * initReminder
 * Initializes the "reminder" link within a registration/login form,
 * which essentially just toggles b/w the two respective views
 *
 * @param mixed selector A valid jQuery selector of the form reminder (must be
 *		a descendant of a .registration element -- which is what gets replaced)
 */
		initReminder: function initReminder(selector, reminder) {
			var $dialog = GOOD.form.getDialog(selector),
				$container = $dialog.find('.registration'),
				$reminder = $container.find('a[href=/login],a[href=/users/signup]');				

			$reminder.unbind().click(function (e) {

				e.preventDefault();

				$.get(this.href, function (html) {
					var $html = $(html),
						$css = $html.filter('link'),
						$js = $html.filter('script'),
						$registration = $html.filter('.registration'),
						$existing = $container.children().not('.facebook'),
						$replacement = $html.children().not('.facebook');

					GOOD.form.animateAndReplace($existing, $replacement, {
						before: function ($old, $new) {
							$dialog
								.find('link')
									.remove()
									.end()
								.append($css);
							$container.attr('class', $registration.attr('class'));
							$new.find('#UserUserEmail').val($old.find('#UserUserEmail').val());
						},
						after: function ($old, $new) {
							$dialog.dialog('option', { title: $reminder.attr('title') });
							$new.find('#UserUserEmail').focus();
							$dialog.append($js);
						}
					});
				});
			});
		},

/**
 * initForgetLink
 * Initializes the forgot password "link" on login and facebook associate forms
 */
		initForgetLink: function (selector) {
			var $form = $(selector),
				$forgot = $form.find('[href=/forgot_password]');

			$forgot.unbind().click(function (e) {
				var $this = $(this),
					$email = $form.find('[id=UserEmail]'),
					emailData = {};

				function update(text, timeOut, timeIn) {
					timeOut = timeOut || 100;
					timeIn = timeIn || 500;
					$this.animate({ opacity:0 }, timeOut, function () {
						$this.html(text).animate({ opacity:1 }, timeIn);
					});
				}

				function reset() {
					$email.focus();
					update('Click here to reset your password', 1000, 500);
				}

				e.preventDefault();

				if ($email[0].value) {

					emailData[$email[0].name] = $email[0].value;

					$this.addClass('submitting');

					$.ajax({
						type: 'POST',
						url: this.href,
						dataType: 'json',
						data: emailData,
						success: function (json) {

							if (json.success) {
								$this
									.removeAttr('href')
									.unbind('click')
									.addClass('searched');

								$form.find('[id=UserUserPass]').focus();
							}

							$this.removeClass('submitting');
							update(json.message);

							if (!json.success) {
								$email.one('click', reset);
							}
						}
					});

				} else {
					update('Please provide an email address or username above.');
					$email.one('click', reset);
				}
			});
		},

/**
 * initLogin
 * Initializes a login process
 *
 */
		login: function login(selector) {
			var $login = $(selector);

			GOOD.form.initForm($login, {
				formSuccess:function () {
					GOOD.refresh(!GOOD.form.isInDialog($login));
				}
			});

			GOOD.form.initForgetLink($login);
			GOOD.form.initReminder($login);
		},

/**
 * initSignup
 * Initializes a signup process
 *
 */
		signup: function (selector) {
			var $signup = $(selector);

			GOOD.form.initForm($signup, {
				formSuccess: function () {
					GOOD.refresh(!GOOD.form.isInDialog($signup));
				},
				formError: function (json) {
					var $reminder = GOOD.form.getAncestor($signup, '.registration').find('.reminder');

					GOOD.form.enable($signup);

					if (json.errors && /account already exists/.test(json.errors.user_email)) {

						$.get('/login', function (html) {
							var $html = $(html);

							GOOD.form.animateAndReplace($signup, $html.find('form'), {
								before: function ($old, $new) {
									$new.find('#UserUserEmail').val($old.find('#UserUserEmail').val());
									$reminder.html($html.find('.reminder').html());
									$new.find('a[href=/login]').click(function () {
										$new.find('#UserUserEmail').val('');
									});
								},
								after: function ($old, $new) {
									GOOD.form.error($new, json.errors.user_email);
									GOOD.form.login($new);
									$new.find('#UserUserPass').focus();
								}
							});
						});

					} else {
						GOOD.form.error($signup, json.errors);
					}
				}
			});

			GOOD.form.initReminder($signup);
		},

/**
 * initForgotPassword
 * Initializes a reset password process
 */
		forgotPassword: function (selector) {
			var $forgot = $(selector);

			GOOD.form.initForm($forgot);
		},

/**
 * initFacebookAccount
 * Initializes a facebook connect confirmation process
 */
		facebookAccount: function (selector) {
			var $associate = $(selector),
				$container = $('.facebookAccount'),
				$quickClick = $container.find('.tell-friends'),
				$tellFriends = $quickClick.find('a'),
				$done = $container.find('.button');

			$tellFriends.click(function (e) {
				var url = this.href;

				e.preventDefault();

				FB.Connect.showPermissionDialog('publish_stream', function () {
					$.ajax({
						url: url,
						dataType: 'json',
						success: function (json) {
							$quickClick.animate({ opacity:0 }, function () {
								$quickClick
									.html(json.message)
									.animate({ opacity:1 })
									.removeAttr('href')
									.unbind();
							});
						}
					});
				});
			});

			$done.click(function () {
				GOOD.refresh(!GOOD.form.isInDialog($associate));
			});
/*
			GOOD.form.initForm($associate, {
				success: function () {
					GOOD.refresh(!GOOD.form.isInDialog($associate));
				}
			});
			GOOD.form.initForgetLink($associate);
*/
			// Break out any common elements into new funtions
			$associate.submit(function (e) {

				e.preventDefault();

				GOOD.form.ajaxSubmit(this, {
					success: function (success, status) {
						if (success === 1) {
							GOOD.form.confirm($associate, 'Your accounts have now been successfully connected.', function () {
								GOOD.refresh(!GOOD.form.isInDialog($associate));
							});
						} else {
							GOOD.form.enable($associate);
							GOOD.form.error($associate, 'We had trouble connecting your accounts. Please try again');
						}
					}
				});
			});
		}
	},

	refresh: function (referrer) {
		var url;
		if (referrer === true) {
			if (document.referrer) {
				url = document.referrer;
			} else {
				url = '/';
			}
		} else {
			url = window.location.href;
		}
		window.location.replace(url);
		window.location.href = url;
	},

	// Attach input clearing for focus & blur states
	clearInputOnFocus: function (selector) {
		$(selector)
			.bind(
				'focus.clearInput',
				function() {
					this.select();
					if (this.value.toLowerCase() === this.defaultValue.toLowerCase()) {
						this.value = '';
					}
				}
			)
			.bind(
				'blur.clearInput',
				function() {
					if (this.value === '' && !this.hasChanged) {
						this.value = this.defaultValue;
					}
				}
			)
			.bind(
				'keydown.clearInput',
				function(e) {
					if (e.keyCode !== 9) {
						this.hasChanged = true;
						$(this).unbind('keydown.clearInput');
					}
				}
			);
	},

	ads: {
		// This method takes a collection of ads, indexed by a predetermined total height
		// of each collection, and determines which collection best fits within the 
		// available height. Once the correct collection is determined, a list of 
		// placeholders -- sent as an array of jQuery selectors (preferably #ids) --
		// are iterated over and replaced with the appropriate ad. This verbose iteration
		// is done instead of simply passing a single selector to a jQuery function so
		// that the original order can be preserved. jQuery collections are typically
		// ordered by when they appear in the DOM.
		populateByAvailableHeight: function (options) {
			var availableHeight = options.height || 0,
				placeholders = options.placeholders || null,
				adMap = options.adMap || null,
				greatestHeight = 0,
				leastHeight, adCollection, i, placeholder;
			if (adMap) {
				for (adHeight in adMap) {
					adHeight = parseInt(adHeight);
					if (!leastHeight || adHeight < leastHeight) {
						leastHeight = adHeight;
					}
					if (availableHeight > adHeight && adHeight > greatestHeight) {
						greatestHeight = adHeight;
					}
				}
				greatestHeight = greatestHeight || leastHeight;
				adCollection = adMap[greatestHeight];
				for (i=0; i<placeholders.length; i++) {
					placeholder = $(placeholders[i]);
					if (placeholder.length) {
						if (adCollection[i]) {
							placeholder.replaceWith(adCollection[i]);
						} else {
							placeholder.remove();
						}
					}
				}
			}
		}
	}
});


// A class for automatically filling the right rail of a post page. For the
// common case, usage is simply:
//
//   var populator = new SidebarModulePopulator();
//   populator.start();
//
// The populator will compare the sidebar's height to that of the content-well
// every .5s; if the sidebar could expand, it will request /posts/right_rail,
// expecting a JSON array of sidebar module divs. These will be hidden and
// placed in the sidebar, then revealed one at a time until no more can fit
// without increasing the size of the content well.
function SidebarModulePopulator(options) {
	var o = options || {},
		content = o.content || $('.content-well'),
		sidebar = o.sidebar || $('.sidebar'),
		interval = o.interval || 500,
		url = o.url || '/posts/right_rail',
		timer,
		currentlyFilling = false,
		contentHeight = 0;

	// private

	function requestModules() {
		$.get(url, function (data) {
			var i;
			// Hide and append new modules to the sidebar; fill() will 
			// reveal them as needed.
			for (i = 0; i < data.modules.length; ++i) {
				$(data.modules[i]).hide().appendTo(sidebar);
			}
			fill();
		}, 'json');
	}

	function fill() {
		var hiddens, first;

		// Guard against multiple concurrent fills.
		if (currentlyFilling) { return; }
		currentlyFilling = true;

		// Check for space in the sidebar. If there's enough, reveal any 
		// hidden modules one at a time to fill it. Fetch additional hidden
		// modules as necessary.
		hiddens = $.makeArray(sidebar.children('div:hidden'));
		while (contentHeight - sidebar.height() > 0) {
			if (hiddens.length === 0) {
				requestModules();
				// requestModules() is async, and will call fill() again 
				// upon completion.
				break;
			}
			first = $(hiddens.shift());
			if (first.height() > contentHeight - sidebar.height()) {
				hiddens.unshift(first);
				break;
			}
			first.fadeIn(200);
		}
		currentlyFilling = false;
	}

	// public

	this.start = function () {
		// Fill the sidebar when content's height increases.
		timer = setInterval(function () {
			var newContentHeight = content.height();
			if (newContentHeight > contentHeight) {
				contentHeight = newContentHeight;
				fill();
			}
		}, interval);
	};

	this.stop = function () {
		clearTimeout(timer);
	};
}


//////////////////////////
// Site/DOM initialization
//////////////////////////

// Attach jQuery UI dialogs with GOOD helper method
GOOD.dialog('.header a[href="/login"]');


// parseUri 1.2.2
// (c) Steven Levithan <stevenlevithan.com>
// MIT License
function parseUri (str) {
	var	o   = parseUri.options,
		m   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
		uri = {},
		i   = 14;

	while (i--) uri[o.key[i]] = m[i] || "";

	uri[o.q.name] = {};
	uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
		if ($1) uri[o.q.name][$1] = $2;
	});

	return uri;
};

parseUri.options = {
	strictMode: false,
	key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
	q:   {
		name:   "queryKey",
		parser: /(?:^|&)([^&=]*)=?([^&]*)/g
	},
	parser: {
		strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
		loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
	}
};


var open_in_new_tab = function( e )
{
	var url = parseUri(this.href),
	checkProtocol = url.protocol && (url.protocol === 'http' || url.protocol === 'https'),
	checkHost = url.host && !url.host.match(/good\.is$/);
  
	if (checkProtocol && checkHost && !this.target) 
  {
		this.target = '_blank';
	}

};

// Open all non-good.is links in a new window
$('#page #goodNewsLinks').delegate('a[href]', 'click', open_in_new_tab ); // short links on home page
$('.main .post').delegate('a[href]', 'click', open_in_new_tab ); // post page links
