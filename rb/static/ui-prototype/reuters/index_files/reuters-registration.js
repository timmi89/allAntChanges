
  function rr_reportAbuse(path,bid,pid,id) {

    strNormalLoginVar='';

   if(isSignin()) {
      jQuery.getJSON("/wp-content/plugins/reuters-registration/ajax-lookup.php?r="+Math.random(), null,
  	function(data) {
	  screenname = data['screenName'];
	  customerId = data['customerID'];

	  // No screenname, make the user add one.
          if( (screenname==null) || (screenname=="") && (customerId!=null && customerId!="") ) {
	    jQuery("#loginbox").empty();
            jQuery("#loginbox").jqm({modal:true});
            jQuery("#loginbox").jqmShow();   
            updateScreenName("loginbox", new UpdateCallback())	
          }
          else { 
            document.getElementById('loginstatus').innerHTML = "Welcome back "+screenname;
          }
	}
      );

      jQuery("#loginbox").empty();
      jQuery("#loginbox").jqm({modal:true});
      jQuery("#loginbox").jqmShow(); 

      jQuery("#loginbox").html("<div id=\"abusebox\"><div class=\"header\"><div class=\"headerText\">Report Abuse</div></div><div class=\"abuseConfirm\"><p>Please confirm you would like to report this comment as abusive.</p><div id=\"abuseyes\"><a href=\"#\" onclick=\"javascript:rr_sendAbuse('"+path+"',"+bid+","+pid+","+id+"); return false;\"><img style=\"border: 0px;\" src=\"http://www.reuters.com/resources_v2/images/btn_reportAbuse.gif\" /></a></div><div id=\"abuseno\"><a href=\"#\" onclick=\"javascript:rr_closeOverlay(); return false;\"><img src=\"http://www.reuters.com/resources_v2/images/btn_cancel.gif\" style=\"border:0px;\" /></a></div><div id=\"abusefoot\">* Please note that you can only submit one abuse report for a comment.</div></div>");

	rr_alignloginbox();

      return false;
    }
    else {
      jQuery("#loginbox").empty();
      jQuery("#loginbox").jqm({modal:true});
      jQuery("#loginbox").jqmShow();   
      loginUser('loginbox', null, new LoginCallback());

	rr_alignloginbox();
	rr_outerClose();
    }

  }

  function rr_checkLogin() {

    strNormalLoginVar='';

    if(isSignin()) {
      jQuery.getJSON("/wp-content/plugins/reuters-registration/ajax-lookup.php?r="+Math.random(), null,
  	function(data) {
	  screenname = data['screenName'];
	  customerId = data['customerID'];

	  // No screenname, make the user add one.
          if( (screenname==null) || (screenname=="") && (customerId!=null && customerId!="") ) {
	    jQuery("#loginbox").empty();
            jQuery("#loginbox").jqm({modal:true});
            jQuery("#loginbox").jqmShow();   
            updateScreenName("loginbox", new UpdateCallback())	

		rr_alignloginbox();

          }
          else { 
	    jQuery("#pendingstatus").empty();
            document.getElementById('loginstatus').innerHTML = "Welcome back "+screenname;
          }
	}
      );

      return true;
    }
    else {
	//      jQuery("#loginbox").fadeIn(250);
      jQuery("#loginbox").empty();
      jQuery("#loginbox").jqm({modal:true});
      jQuery("#loginbox").jqmShow();   
      loginUser('loginbox', null, new LoginCallback());

	rr_alignloginbox();
	rr_outerClose();

    }
  }

function rr_outerClose() {

	jQuery('.jqmOverlay').bind('click',function() {
		rr_closeOverlay();
	});

}
	
	function rr_alignloginbox() {

		var ww = jQuery(window).width();
		var wh = jQuery(window).height();

		var lbw = jQuery('#loginbox').width();
		var lbh = jQuery('#loginbox').height();

		var lbl = (ww/2) - (lbw/2);
		var lbt = 100;

		var h_br = navigator.userAgent;
		if (h_br.indexOf("MSIE 6") != -1) {
			var scrollTop = jQuery(window).scrollTop()*1;
			lbt = scrollTop + 100;
		}

		jQuery('#loginbox').css({
			'top':lbt+'px',
			'left':lbl+'px'
		});

		jQuery(window).bind('resize',function() {
			rr_alignloginbox();
		});

	}

  function rr_closeOverlay() {
      jQuery("#loginbox").jqmHide();   
      jQuery("#loginbox").empty();
  }

  function rr_sendAbuse(path,bid,pid,cid) {

      jQuery.getJSON(path+"wp-content/plugins/reuters-registration/report-abuse.php?blog_id="+bid+"&post_id="+pid+"&comment_id="+cid);

      jQuery("#loginbox").jqmHide();      
      jQuery("#loginbox").empty();
  }

  function UpdateCallback(){}
    UpdateCallback.prototype.postLogin = function() {
      //This callback function will be invoked when user clicks on the close window button in the overlay.
      jQuery("#loginbox").jqmHide();
      jQuery("#loginbox").empty();
      document.getElementById('loginstatus').innerHTML = "Screenname updated!";
    
    }

    UpdateCallback.prototype.cancelLogin = function() {
      //This callback function will be invoked when user clicks on the close window button in the overlay.
      jQuery("#loginbox").jqmHide();
      // document.getElementById('loginstatus').innerHTML = "Cancel Login!";
    
    }

  function LoginCallback(){}
    LoginCallback.prototype.postLogin = function() {
	
      jQuery.getJSON("/wp-content/plugins/reuters-registration/ajax-lookup.php?rr=1&r="+Math.random(), null,
  	function(data) {
	  screenname = data['screenName'];
	  customerId = data['customerID'];

	  // No screenname, make the user add one.
          if( (screenname==null) || (screenname=="") && (customerId!=null && customerId!="") ) {
            updateScreenName("loginbox", new UpdateCallback())	
          }
          else { 
	    jQuery("#loginbox").jqmHide();
	    jQuery("#loginbox").empty();
	    jQuery("#pendingstatus").empty();
            document.getElementById('loginstatus').innerHTML = "Welcome back "+screenname;
	    doBlogsLoginMenu();
          }
	}
      );
    }

    LoginCallback.prototype.cancelLogin = function() {
      //This callback function will be invoked when user clicks on the close window button in the overlay.
      jQuery("#loginbox").jqmHide();
      // document.getElementById('loginstatus').innerHTML = "Cancel Login!";
    
    }

function doBlogsLoginMenu()
{
	var loggedInNavsStyle = "none";
	var loggedOutNavsStyle = "none";
	if(isSignin())
		loggedInNavsStyle = "inline";
	else
		loggedOutNavsStyle = "inline";
		
	if (document.all)
	{
		if(document.all['loggedInNavs'] != null)
		{
			document.all['loggedInNavs'].style.display = loggedInNavsStyle;
			document.all['loggedOutNavs'].style.display = loggedOutNavsStyle;
		}
	}
	else if (document.layers)
	{
		if(document.layers['loggedInNavs'] != null)
		{
			document.layers['loggedInNavs'].display = loggedInNavsStyle;
			document.layers['loggedOutNavs'].display = loggedOutNavsStyle;
		}
	}
	else
	{
		if(document.getElementById('loggedInNavs') != null)
		{
			document.getElementById('loggedInNavs').style.display = loggedInNavsStyle;
			document.getElementById('loggedOutNavs').style.display = loggedOutNavsStyle;
		}
	}
}

