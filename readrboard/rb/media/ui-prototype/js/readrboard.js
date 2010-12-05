var RDR = RDR ? RDR : {};
var $R = $R ? $R : $;  // make our own jquery object
RDR = {
	// none of this obj's properties are definite.  just jotting down a few ideas.
	errors : {
		tooltip: {
			rating:"",
			commenting:""
		}
	},
	why : {},
	styles : {
		/*
		page: 	"<style type='text/css'>"+
				"body 		{background:#fff;}" +
				"body p		{}" +
				"</style>"
		*/
	},
	groupPrefs : {
		// defined by server after initial init call
		blessedTags : [
			{ name: "Great!", value: 5, tid: 0 },
			{ name: "Hate", value: -5, tid: 1 },
			{ name: "Kewl", value: 2, tid: 2 },
			{ name: "No Homo", value: 0, tid: 3 }
		]
	},
	rindow : {
		// content comes later.  this is just to identify or draw the container.
		draw: function() {
			var width = arguments[0].width ? arguments[0].width:400;
			var x = arguments[0].x ? arguments[0].x:100;
			var y = arguments[0].y ? arguments[0].y:100;
			
			new_rindow = $R('div.rdr.window.rewritable');
			if ( new_rindow.length == 0 ) {
				new_rindow = $R('<div class="rdr window rewritable" style="width:' + width + 'px;">' +
					'<div class="rdr-close">x</div>' +
					'<h1></h1>' +
					'<div class="rdr contentSpace"></div>' +
				'</div>');
				$R('body').append( new_rindow );
				new_rindow.find('div.rdr-close').click( function() { $R(this).parents('div.rdr.window').remove(); } );
				new_rindow.draggable({handle:'h1', containment:'document', stack:'.RDR.window', start:function() { $R(this).removeClass('rewritable'); }});
			}
			
			// TODO: this probably should pass in the window and calculate, so that it can be done on the fly
			var coords = RDR.util.stayInWindow(x,y,width,300);
			new_rindow.css('left', coords.x + 'px');
			new_rindow.css('top', coords.y + 'px');
			RDR.tooltip.close();
			return new_rindow;
		},
		closeAll: function() {
			$R('div.rdr.window').remove();
		}
	},
	tooltip : {
		draw: function() {
			if ( $R('div.rdr.tooltip').length == 0 ) {
				var x = arguments[0].x ? arguments[0].x : 100;
				var y = arguments[0].y ? (arguments[0].y-45) : 100;
				var coords = RDR.util.stayInWindow(x,y,200,30);
				var new_tooltip = $R('<div class="rdr tooltip" style="left:' + coords.x + 'px;top:' + coords.y + 'px;">' +
					'<a href="javascript:void(0);" onclick="RDR.actions.rateStart();">Rate</a>' +
				'</div>');
				$R('body').append( new_tooltip );
			}
		},
		close: function() {
			$R('div.rdr.tooltip').remove();
		}
	},
	util : {
		stayInWindow : function(x,y,w,h) {
			var coords = {};
			var winWidth = $R(window).width();
			var winHeight = $R(window).height();
			if ( x > winWidth ) { x = winWidth - w; }
			if ( y > winHeight ) { y = winHeight - h; }
			if ( x < 10 ) x = 10;
			if ( y < 10 ) y = 10;
			coords.x = x;
			coords.y = y;
			return coords;
		}
	},
	actions : {
		rateStart : function() {
			// draw the window over the tooltip
			var tooltipOffsets = $R('div.rdr.tooltip').offset();
			var rindow = RDR.rindow.draw({x:tooltipOffsets.left, y:tooltipOffsets.top});

			// write content to the window
			var rateStartContent = '<em class="rdr-selected-text"></em><ul class="rdr-tags preselected">';
			for (var i=0,j=RDR.groupPrefs.blessedTags.length; i<j; i++) {
					rateStartContent += '<li><a href="javascript:void(0);">'+RDR.groupPrefs.blessedTags[i].name+'</a></li>';
				}
				rateStartContent += '</ul>' +
				'<div class="rdr-instruct">Add your own ratings, separated by comma:</div>' +
				'<input type="text" />' +
				'<button>Rate</button>' +
				'<div class="rdr-help">e.g., Love this, autumn, insightful</div>';
			rindow.find('div.contentSpace').append( rateStartContent );
			rindow.find('h1').text('Rate This');
			rindow.find('em.rdr-selected-text').html( RDR.why.content );
			
				// using list of blessed tags
		},
		startSelect : function(e) {
			// make a jQuery object of the node the user clicked on (at point of mouse up)
			var mouse_target = $R(e.target);

			// make sure it's not selecting inside the RDR windows.
			if ( !mouse_target.hasClass('rdr') && mouse_target.parents('div.rdr').length == 0 ) {
				
				// closes undragged windows
				$R('div.rdr.window.rewritable, div.rdr.tooltip').remove();

				// see what the user selected
				// TODO: need separate image function, which should then prevent event bubbling into this
				RDR.why.sel = RDR.actions.selectedText();
				if ( RDR.why.sel.text && RDR.why.sel.text.length > 3 && RDR.why.sel.text.indexOf(" ") != -1 ) {
					
					// next line's redundant, but this way we just use .content in later functions, based on itemType
					RDR.why.content = RDR.why.sel.text;  
					RDR.why.itemType = "text";
					RDR.why.blockParent = null;

					// can we comment on the selection?
					// identify the selection's block parent (RDR.why.blockParent)
					// see it contains the whole selection text
					// and check for the rdr class.
					if ( RDR.why.sel.obj.css('display') != "block" ) {
						RDR.why.sel.obj.parents().each( function() {
							// cache the obj... faster!
							var aParent = $R(this);
							if ( aParent.css('display') == "block" ) {
								// we've found the first parent of the selected text that is block-level
								RDR.why.blockParent = aParent;
								return false;  // exits out of a jQuery.each loop
							}
						});
					} else {
						// the node initially clicked on is the first block level container
						RDR.why.blockParent = RDR.why.sel.obj;
					}

					// cache the blockParent's text for slightly faster processing
					RDR.why.blockParent.text = RDR.why.blockParent.text();
				
					if ( RDR.why.blockParent.text && RDR.why.blockParent.text.length > 0) {

						// now, strip newlines and tabs -- and then the doublespaces that result
						RDR.why.blockParentTextClean = RDR.why.blockParent.text.replace(/[\n\r\t]+/gi,' ').replace(/\s{2,}/g,' ');
						RDR.why.selectionTextClean = RDR.why.content.replace(/[\n\r\t]+/gi,' ').replace(/\s{2,}/g,' ');

						if ( RDR.why.blockParentTextClean.indexOf( RDR.why.selectionTextClean ) != -1 ) {
							// this can be commented on if it's long enough and has at least one space (two words or more)
							RDR.tooltip.draw({x:parseInt(e.pageX), y:parseInt(e.pageY) });

							// also should detect if selection has an image, embed, object, audio, or video tag in it
						} else {
							RDR.tooltip.draw({x:parseInt(e.pageX), y:parseInt(e.pageY), cant_comment:true });
						}
					}
				}
			}
		},
		selectedText : function(win) {
			/**
			modified from Drew Dodson's code here:
			http://perplexed.co.uk/1020_text_selector_jquery_plugin.htm
			we can remove all of his comments at runtime.  this seems to run fine for me in Firefox.
			TODO: test in IE!
			*/
			
			var win = win ? win : window;

			var obj = null;
			var text = null;

			// Get parent element to determine the formatting applied to the selected text
			if(win.getSelection){
				var obj = win.getSelection().anchorNode;

				var text = win.getSelection().toString();
				// Mozilla seems to be selecting the wrong Node, the one that comes before the selected node.
				// I'm not sure if there's a configuration to solve this,
				var sel = win.getSelection();
				
				if(!sel.isCollapsed && $R.browser.mozilla){
					/*
					TODO:  I don't think we need this, but we need to test more and see if we need it back.
						   His code's a year old and I'm thinking Mozilla fixed the need for all this..?
					
					// If we've selected an element, (note: only works on Anchors, only checked bold and spans)
					// we can use the anchorOffset to find the childNode that has been selected
					if(sel.focusNode.nodeName !== '#text'){
						// Is selection spanning more than one node, then select the parent
						if((sel.focusOffset - sel.anchorOffset)>1)
							//Selected spanning more than one
							obj = sel.anchorNode;
						else if ( sel.anchorNode.childNodes[sel.anchorOffset].nodeName !== '#text' )
							//Selected non-text
							obj = sel.anchorNode.childNodes[sel.anchorOffset]
						else
							//Selected whole element
							obj = sel.anchorNode;
					}
					// if we have selected text which does not touch the boundaries of an element
					// the anchorNode and the anchorFocus will be identical
					else if( sel.anchorNode.data === sel.focusNode.data ){
						//Selected non bounding text
						obj = sel.anchorNode.parentNode;
					}
					// This is the first element, the element defined by anchorNode is non-text.
					// Therefore it is the anchorNode that we want
					else if( sel.anchorOffset === 0 && !sel.anchorNode.data ){
						//Selected whole element at start of paragraph (whereby selected element has not text e.g. &lt;script&gt;
						obj = sel.anchorNode;
					}
					// If the element is the first child of another (no text appears before it)
					else if( typeof sel.anchorNode.data !== 'undefined' 
								&& sel.anchorOffset === 0 
								&& sel.anchorOffset < sel.anchorNode.data.length ){
						//Selected whole element at start of paragraph
						obj = sel.anchorNode.parentNode
					}
					// If we select text preceeding an element. Then the focusNode becomes that element
					// The difference between selecting the preceeding word is that the anchorOffset is less that the anchorNode.length
					// Thus
					else if( typeof sel.anchorNode.data !== 'undefined'
								&& sel.anchorOffset < sel.anchorNode.data.length ){
						//Selected preceeding element text
						obj = sel.anchorNode.parentNode;
					}
					// Selected text which fills an element, i.e. ,.. <b>some text</b> ...
					// The focusNode becomes the suceeding node
					// The previous element length and the anchorOffset will be identical
					// And the focus Offset is greater than zero
					// So basically we are at the end of the preceeding element and have selected 0 of the current.
					else if( typeof sel.anchorNode.data !== 'undefined' 
							&& sel.anchorOffset === sel.anchorNode.data.length 
							&& sel.focusOffset === 0 ){
						//Selected whole element text
						obj = (sel.anchorNode.nextSibling || sel.focusNode.previousSibling);
					}
					// if the suceeding text, i.e. it bounds an element on the left
					// the anchorNode will be the preceeding element
					// the focusNode will belong to the selected text
					else if( sel.focusOffset > 0 ){
						//Selected suceeding element text
						obj = sel.focusNode.parentNode;
					}
					*/
				}
				else if(sel.isCollapsed) {
					obj = obj ? (obj.parentNode ? obj.parentNode:obj) : "";
				}

			}
			else if(win.document.selection){
				var sel = win.document.selection.createRange();
				var obj = sel;

				if(sel.parentElement)
					obj = sel.parentElement();
				else 
					obj = sel.item(0);

				text = sel.text || sel;

				if(text.toString)
					text = text.toString();
			}
			else 
				throw 'Error';

			// webkit
			if(obj.nodeName==='#text')
				obj = obj.parentNode;

			// if the selected object has no tagName then return false.
			if(typeof obj.tagName === 'undefined')
				return false;

			return {'obj':$R(obj),'text':text};
		}
	}
};

// append the predefined styles into the page
// document.write("");

// init the drag selection tracker
$R('body').bind('mouseup.rdr', RDR.actions.startSelect );
