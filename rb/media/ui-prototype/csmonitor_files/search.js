/*
 * search.js
 * Duo Consulting
 * http://www.duoconsulting.com
 */

/* Search box behavior */

/* Sets initial state if there is content in the search box. */
if (jQuery.trim(jQuery('#query')[0].value).length != 0) {
	jQuery('#searchLabel').addClass('hidden');
}

/* Hide the label when the input gets focus */
jQuery('#query').focus(function() {
	jQuery('#searchLabel').addClass('hidden');
});

/* Show the label when the input loses focus if it's empty */
jQuery('#query').blur(function() {
	if (jQuery.trim(this.value).length == 0) {
		jQuery('#searchLabel').removeClass('hidden');
	}
});
