/*
* jquery.selectionographer.js
* $.fn.selog aliases to $.fn.selectionographer
* 
* author: readrboard.com, eric@readrboard.com
*
* ------------------------------------------------------------------------------------------------------------
*
* Selectionographer is a cross browser jquery plugin that lets you work with the browser's 'user selection'.
* (More precisely, it can save, re-activate, and manipulate the browser's 'selection object' and 'ranges'.)
* 
* The plugin leverages and depends on the Rangy javascript library written by Tim Down who deserves
* most of the credit for making this plugin possible.
* http://code.google.com/p/rangy/ - thanks very much Tim.
*
* note: the abreviated 'selog' can always be used in place of 'selectionographer'
* note: uses the jquery plugin pattern,
* so the first argument is the method name, the rest are parameters to the method.
* see: http://docs.jquery.com/Plugins/Authoring
*
*/        

// ------------------------------------------------------------------------------------------------------------

/*API Methods*/

// init (implied by empty method)
// inits the plugin with or without options
	$(window).selog()
	//or
	$(window).selog(options);
	//todo: for now, always use $(window).  More later about $(window) vs $(p.hash) etc.


// save
// saves a selection state.
	$(window).selog( 'save' );
	$(window).selog( 'save', rangeOrSerialRange );
	// rangeOrSerialRange is optional: defaults to active selection range.
	// type should be a rangy range, or a rangy range serialization string,
	// which can be accessed through the selState object - selState.range and selState.serialRange


// activate
// activates a selection state in the browser.  (Just like you selected it yourself)
	$(window).selog( 'activate' );
	$(window).selog( 'activate', idxOrSelState );
	// idxOrSelState is optional: defaults to last selState on the stack.
	// type should be a selState object, or its stack index
		// note: If you want to activate a range that has not yet been saved in that session,
		// use the helper method 'activateRange' instead - see below for info.


// modify
// clones and modifies a selState object and saves it as a new selState
	$(window).selog( 'modify' );
	$(window).selog( 'modify', idxOrSelState, [filters] );
	// idxOrSelState and [filters] are both optional
	// idxOrSelState behaves as it does in the 'activate' method - see above.
	// [filters] is a list of strings that name filters to be called in their listed order.
		// if omited, all filters are run.
		// (Currently does our word snap, but later can be used for more intracate rules.)
		// An empty list will run no filters.  But then why'd you call the method, dummy?

// hilite
// hilites the selState range with styled span wraps around the selected text.
	$(window).selog( 'hilite', );
	$(window).selog( 'hilite', idxOrSelState );
	$(window).selog( 'hilite', idxOrSelState, switchOnOffToggle);
	// idxOrSelState is optional and behaves as it does in the 'activate' method - see above.
	// switchOnOffToggle is optional and must be a string 'on', 'off', or 'toggle'.  Defaults to "on"
	// Note: Uses the rangy CssClassApplier tool to add and remove styled span wraps.

		// Example: (notice the $R - our jquery alias - if you use this in the console)
		// toggles the hilite for the most recent selState on and off.  
		$R(window).selog( 'hilite', 'toggle');

		// Example:  Brain teaser for you.
		// Without using out widget, saves the selected text to a selState, and then hilites it.
		// works because the 'save' method returns a selState object.
		$R(window).selog( 'hilite', $R(window).selog( 'save') )

// ------------------------------------------------------------------------------------------------------------

/* some API Helper Methods*/

// smartHilite
// saves, modifies with the word-snap filters, and hilites the current user selection
	$(window).selog('helpers', 'smartHilite');

// activateRange
// saves and activates a range.
// If you're trying to use the 'activate' method on a range instead of a selState, don't - use this instead.
	$(window).selog('helpers', 'activateRange', rangeOrSerialRange);


