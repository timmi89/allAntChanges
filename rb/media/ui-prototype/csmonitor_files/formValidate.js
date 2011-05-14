/*
 * Copyright © 2007 Silverpop Systems, Inc.  All rights reserved.
 *
 * WARNING: This file contains methods which are a published Silverpop API for use in custom Web Forms,
 * changes must be approved and communicated by the Product team.
 *
 * The following are common validation routines used by any screens that need to
 * validate user input.
 */

/*
 *Checks if an email address is valid, modified from http://javascript.internet.com/forms/check-email.html
*/
function f_isValidEmail(a_sEmail, field)
{
   if (a_sEmail != null && a_sEmail != "")
   {
      /* The following pattern is used to check if the entered e-mail address
         fits the user@domain format.  It also is used to separate the username
         from the domain. */
      var emailPat=/^(.+)@(.+)$/;
      /* The following string represents the pattern for matching all special
         characters.  We don't want to allow special characters in the address.
         These characters include ( ) < > @ , ; : \ " . [ ]    */
      var specialCharsUser="\\(\\)<>@,;:\\\\\\\"\\.\\[\\]";
      var specialCharsDomain="\\(\\)<>@,;:\\\\\\\"\\.\\[\\]\\'";

      /* The following string represents the range of characters allowed in a
         username or domainname.  It really states which chars aren't allowed. */
      var validCharsUser="\[^\\s" + specialCharsUser + "\]";
      var validCharsDomain="\[^\\s" + specialCharsDomain + "\]";
      /* The following pattern applies if the "user" is a quoted string (in
         which case, there are no rules about which characters are allowed
         and which aren't; anything goes).  E.g. "jiminy cricket"@disney.com
         is a legal e-mail address. */
      var quotedUser="(\"[^\"]*\")";
      /* The following pattern applies for domains that are IP addresses,
         rather than symbolic names.  E.g. joe@[123.124.233.4] is a legal
         e-mail address. NOTE: The square brackets are required. */
      var ipDomainPat=/^\[(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\]$/;
      /* The following string represents an atom (basically a series of
         non-special characters.) */
      var atomUser=validCharsUser + '+';
      var atomDomain=validCharsDomain + '+';
      /* The following string represents one word in the typical username.
         For example, in john.doe@somewhere.com, john and doe are words.
         Basically, a word is either an atom or quoted string. */
      var wordUser="(" + atomUser + "|" + quotedUser + ")";
      // The following pattern describes the structure of the user
      var userPat=new RegExp("^\\.*" + wordUser + "(\\.*" + wordUser + ")*\\.*$");
      /* The following pattern describes the structure of a normal symbolic
         domain, as opposed to ipDomainPat, shown above. */
      var domainPat=new RegExp("^" + atomDomain + "(\\." + atomDomain +")*$");


      /* Finally, let's start trying to figure out if the supplied address is
         valid. */

      /* Begin with the coarse pattern to simply break up user@domain into
         different pieces that are easy to analyze. */
      var matchArray=a_sEmail.match(emailPat);
      if (matchArray==null)
      {
        /* Too many/few @'s or something; basically, this address doesn't
           even fit the general mould of a valid e-mail address. */
        callAlertWithField("The format of the email address you entered is not valid for email addresses.", field);
        return false;
      }
      var user=matchArray[1];
      var domain=matchArray[2];

      // See if "user" is valid
      if (user.match(userPat)==null)
      {
          // user is not valid
          callAlertWithField("Email username doesn't seem to be valid.", field);
          return false;
      }

      /* if the e-mail address is at an IP address (as opposed to a symbolic
         host name) make sure the IP address is valid. */
      var IPArray=domain.match(ipDomainPat);
      if (IPArray!=null)
      {
          // this is an IP address
          for (var i=1;i<=4;i++)
           {
            if (IPArray[i]>255)
             {
                callAlertWithField("Email IP address is invalid!", field);
                 return false;
            }
          }
          return true;
      }

      // Domain is symbolic name
      var domainArray=domain.match(domainPat);
      if (domainArray==null)
      {
        callAlertWithField("Email domain name doesn't seem to be valid.", field);
         return false;
      }

      /* domain name seems valid, but now make sure that it ends in a
         three-letter word (like com, edu, gov) or a two-letter word,
         representing country (uk, nl), and that there's a hostname preceding
         the domain or country. */

      /* Now we need to break up the domain to get a count of how many atoms
         it consists of. */
      var atomPat=new RegExp(atomDomain,"g");
      var domArr=domain.match(atomPat);
      var len=domArr.length;
      var topDomain = domArr[domArr.length-1];
      if ( topDomain.length<2 ) // the address must be greater than 1 char
      {
         callAlertWithField("Email address must end in a domain greater than 1 character.", field);
         return false;
      }

      // Make sure there's a host name preceding the domain.
      if (len<2)
      {
         var errStr="Email address is missing a hostname.";
         callAlertWithField(errStr, field);
         return false;
      }
   }

   // If we've gotten this far, everything's valid!
   return true;
}

/*
 *Checks if an email address is a valid MD5 hash
*/
function f_isValidMD5Email(a_sEmail, field)
{
  var md5Pattern = /^[0-9a-f]{32}$/;
  var matches = a_sEmail.match(md5Pattern);
  if (matches == null)
  {
    return false;
  }
  return true;
}

/**
 * Checks if a time value is valid
 *
 */
function f_isValidTime(a_sTime, field)
{
   // Checks if time is in HH:MM:SS AM/PM format.
   // The seconds and AM/PM are optional.

//   var timePat = /^(\d{1,2}):(\d{2})(:(\d{2}))?(\s?(AM|am|PM|pm))?$/;
   var timePat = /^(\d{1,2}):(\d{2})(:(\d{2}))?$/;

   var matchArray = a_sTime.match(timePat);
   if (matchArray == null)
   {
      callAlertWithField("Time is not in a valid format.", field);
      return(false);
   }
   hour = matchArray[1];
   minute = matchArray[2];
   second = matchArray[4];

   if (second=="")
   {
      second = null;
   }

   if (hour < 0  || hour > 23)
   {
      callAlertWithField("Hour must be between 1 and 12. (or 0 and 23 for military time)", field);
      return(false);
   }
   if (minute<0 || minute > 59)
   {
      callAlertWithField("Minute must be between 0 and 59.", field);
      return(false);
   }
   if (second != null && (second < 0 || second > 59))
   {
      callAlertWithField("Second must be between 0 and 59.", field);
      return(false);
   }
   return(true);
}

/**
 * Validates the characters in the text string.  This routine checks for
 * characters that are not allowed.  The intention is to prevent someone from
 * entering scripting code into a text field on a form.
 * Ideally, we would check that the string contained only the allowed
 * characters, but this gets difficult when you consider other character sets.
 *
 * We disallow the following characters: <, >, ", ', %, ;, (, ), &, +
 * this has changed due to tt#20185
 *
 */
function f_isValidText(a_sText, sAdditionalInvalidChars, sExceptions, overrideChars, field, errorMsg)
{
    var commonErrMsg = "Only spaces, single quote, and the following characters are allowed: A-Z, a-z, 0-9, # - _ ( ) . ";
    if (errorMsg != null) {
            commonErrMsg = errorMsg;
    }

    if ( overrideChars != null ) {
        // Update the commonErrMsg to acknowledge the override characters are valid for the given text/field
        for (var i=0; i<overrideChars.length; i++) {
            commonErrMsg += overrideChars.substring(i, i+1) + ' ';
        }
    }

    // Before we start, if there are additional invalid charaters, ensure that if there is overlapping
    // with common allowed characters that we clean up the error message.
    if (sAdditionalInvalidChars) {
        try {
            // You know, this is a hack, but oh well. We really only need to test for very explicit scenarios
            // in which the additional characters contradict the default. So for now, I'm only testing "#".  -CK
            if ( sAdditionalInvalidChars.indexOf("#") > -1 )  {
                var tempRegExToMatch = new RegExp("#", "gi");
                if ( commonErrMsg.match(tempRegExToMatch) ) {
                     commonErrMsg = commonErrMsg.replace(tempRegExToMatch, "");
                }
            }
        } catch (err) { // you know, if there is an exception trying to correct the flippin' error message, just let it go.
        }
    }

    for(i = 0; i < a_sText.length; i++) {
        var l_char = a_sText.charAt(i);
        if (sExceptions && sExceptions.indexOf(l_char) >= 0 ) {
            continue;
        }

        if (sAdditionalInvalidChars && sAdditionalInvalidChars.indexOf(l_char) >= 0 ) {
            if (bodyRef.className == "popupDialogBody") {
                alert("The following characters are not allowed in this field: " + sAdditionalInvalidChars);
            } else {
                callAlertWithField("The following characters are not allowed in this field: " + sAdditionalInvalidChars, field);
            }
            return false;
        }

        if (((l_char < "a" || "z" < l_char) && (l_char < "A" || "Z" < l_char)) &&
          (l_char < "0" || "9" < l_char) && (l_char != "%20") && (l_char != "%23") &&
          (l_char != "(") && (l_char != ")") && (l_char != "-") && (l_char != "_") &&
          (l_char != "#") && (l_char != " ") && (l_char != "'")  && (l_char != ".") ) {

            var invalidCharFound = true;
            // now see if we need to check for overridden characters
            if (overrideChars) {
                if (overrideChars.indexOf(l_char) >= 0) {
                    // we found an override, let it pass
                    invalidCharFound = false;
                }
            }

            if (invalidCharFound) {
                if (bodyRef.className == "popupDialogBody") {
                    alert(commonErrMsg);
                } else {
                    callAlertWithField(commonErrMsg, field);
                }
                return false;
            }
        }
    }

   return true;
}

function mod(div,base) {
    return Math.round(div - (Math.floor(div/base)*base));
}


/**
 * Checks if a value is a number
 *
 */
function f_isNumeric(a_sNumber)
{
   var numString = a_sNumber.toString();

   if(isNaN(a_sNumber))
   {
      callAlert("The number you entered is invalid");
      return(false);
   }

   if (numString.indexOf(".") > -1)
   {
      callAlert("The number you entered is invalid.  Please enter an integer.");
      return(false);
   }
   return(true);
}

function f_isNumericWithDecimal(a_sNumber, field)
{
   if (isNaN(a_sNumber))
   {
      callAlertWithField("The number you entered is invalid", field);
      return(false);
   }
   return(true);
}



// Declaring valid date character, minimum year and maximum year
var dtCh= "/";
var minYear=1900;
var maxYear=2100;

function isInteger(s)
{
   var i;
   for (i = 0; i < s.length; i++){
      // Check that current character is number.
      var c = s.charAt(i);
      if (((c < "0") || (c > "9")))
      {
         return false;
      }
   }
   // All characters are numbers.
   return true;
}

function stripCharsInBag(s, bag)
{
   var i;
   var returnString = "";
   // Search through string's characters one by one.
   // If character is not in bag, append to returnString.
   for (i = 0; i < s.length; i++)
   {
      var c = s.charAt(i);
      if (bag.indexOf(c) == -1)
      {
         returnString += c;
      }
   }
   return returnString;
}

function daysInFebruary (year)
{
    // February has 29 days in any year evenly divisible by four,
    // EXCEPT for centurial years which are not also divisible by 400.
    return (((year % 4 == 0) && ( (!(year % 100 == 0)) || (year % 400 == 0))) ? 29 : 28 );
}

function DaysArray(n)
{
    for (var i = 1; i <= n; i++)
    {
        this[i] = 31;

        if (i==4 || i==6 || i==9 || i==11)
        {
           this[i] = 30;
        }
        if (i==2)
        {
           this[i] = 29;
        }
   }
   return this
}


function f_isValidDate(dtStr, field)
{
   if (dtStr.length != 10)
   {
    callAlertWithField("The date format should be : mm/dd/yyyy", field);
    return(false);
   }
    var daysInMonth = DaysArray(12);
    var pos1=dtStr.indexOf(dtCh);
    var pos2=dtStr.indexOf(dtCh,pos1+1);
    var strMonth=dtStr.substring(0,pos1);
    var strDay=dtStr.substring(pos1+1,pos2);
    var strYear=dtStr.substring(pos2+1);
    strYr=strYear;

    if (strDay.charAt(0)=="0" && strDay.length>1)
    {
       strDay = strDay.substring(1);
    }
    if (strMonth.charAt(0)=="0" && strMonth.length>1)
    {
       strMonth = strMonth.substring(1);
    }
    for (var i = 1; i <= 3; i++)
    {
        if (strYr.charAt(0)=="0" && strYr.length>1)
        {
           strYr = strYr.substring(1);
        }
    }
    month=parseInt(strMonth);
    day=parseInt(strDay);
    year=parseInt(strYr);
    if (pos1==-1 || pos2==-1)
    {
        callAlertWithField("The date format should be : mm/dd/yyyy", field);
        return(false);
    }
    if (strMonth.length<1 || month<1 || month>12)
    {
        callAlertWithField("Please enter a valid month", field);
        return(false);
    }
    if (strDay.length<1 || day<1 || day>31 || (month==2 && day>daysInFebruary(year)) || day > daysInMonth[month])
    {
        callAlertWithField("Please enter a valid day", field);
        return(false);
    }
    if (strYear.length != 4 || year==0 || year<minYear || year>maxYear)
    {
        callAlertWithField("Please enter a valid 4 digit year between "+minYear+" and "+maxYear, field);
        return(false);
    }
    if (dtStr.indexOf(dtCh,pos2+1)!=-1 || isInteger(stripCharsInBag(dtStr, dtCh))==false)
    {
        callAlertWithField("Please enter a valid date", field);
        return(false);
    }
   return(true);
}

function f_isValidDateTime(value, field)
{
  var invalidMsg = "There is an invalid date/time field. You must provide a date(MM/DD/YYYY) and a time(HH:MM:SS).";

  var firstSpace = value.indexOf(" ");
  if (firstSpace < 0) {
    callAlertWithField(invalidMsg, field);
    return false;
  }

  var date = value.substr(0, firstSpace);
  var time = value.substr(firstSpace+1);

  if (!f_isValidDate(date, field)) {
    return false;
  }

  if (!f_isValidTime(time, field)) {
    return false;
  }

  return true;
}

function f_isValidListName(listName, listOrQuery)
{
    if ((listName == "") || (listName == " ")) {
        if (bodyRef.className == "popupDialogBody") {
            alert("Please enter a name for the " + listOrQuery + ".");
        } else {
            callAlert("Please enter a name for the " + listOrQuery + ".");
        }
        return false;
    }

    return f_isValidText(listName);
}

function f_isDateLessThanToday(sDate) {
    compareToDate = new Date(sDate);

    todaysDate = new Date();
    todaysDate.setHours(00);
    todaysDate.setMinutes(00);
    todaysDate.setSeconds(00);

    targetDate = new Date(todaysDate.getTime());

    targetDate.setMonth(compareToDate.getMonth());
    targetDate.setYear(compareToDate.getFullYear());
    targetDate.setDate(compareToDate.getDate());
    var todayDateMilli = todaysDate.getTime();
    var targetDateMilli = targetDate.getTime();

    if (targetDateMilli < todayDateMilli) {
        return true;
    } else {
        return false;
    }
}

function isDateLessThanEqualToDate(sDate1,sDate2) {
    todaysDate = new Date();
    todaysDate.setHours(00);
    todaysDate.setMinutes(00);
    todaysDate.setSeconds(00);

    date1 = new Date(todaysDate);
    date2 = new Date(todaysDate);

    workDate = new Date(sDate1);
    date1.setMonth(workDate.getMonth());
    date1.setYear(workDate.getYear());
    date1.setDate(workDate.getDate());
    var date1Millies = date1.getTime();

    workDate = new Date(sDate2);
    date2.setMonth(workDate.getMonth());
    date2.setYear(workDate.getYear());
    date2.setDate(workDate.getDate());
    var date2Millies = date2.getTime();

    if (date1Millies <= date2Millies) {
        return true;
    } else {
        return false;
    }
}

function f_isDateLessThanDate(sDate1,sDate2) {
    todaysDate = new Date();
    todaysDate.setHours(00);
    todaysDate.setMinutes(00);
    todaysDate.setSeconds(00);

    date1 = new Date(todaysDate);
    date2 = new Date(todaysDate);

    workDate = new Date(sDate1);
    date1.setMonth(workDate.getMonth());
    date1.setYear(workDate.getYear());
    date1.setDate(workDate.getDate());
    var date1Millies = date1.getTime();

    workDate = new Date(sDate2);
    date2.setMonth(workDate.getMonth());
    date2.setYear(workDate.getYear());
    date2.setDate(workDate.getDate());
    var date2Millies = date2.getTime();

    if (date1Millies < date2Millies) {
        return true;
    } else {
        return false;
    }
}

function ValidTime(h, m, s)
  { with (new Date(0,0,0,h,m,s))
    return ((getHours()==h) && (getMinutes()==m))
}

function convertToMilatary(Q) { var T // adaptable to other layouts
  if ((T = /^(\d\d):(\d\d)\s?(([ap])\.?m\.?)?$/i.exec(Q)) == null)
    { return -2 } // bad format
  if (T[3]!='') { // AM/PM
    if (T[1]>'12') { return -1 } // bad value   || T[1]=='00' ?
    T[1] = T[1]%12 + 12* /p/i.test(T[3]) } // to 24-h
  if (!ValidTime(T[1], T[2], 0)) { return -1 } // bad value
  return [ +T[1]+":"+T[2] ] /* for strings, [ LZ(T[1]), T[2] ] */ }

function ShowUSTimeVal(F) {
      S = ReadUStime(F)
      callAlert(S<-1 ? 'Not dd:dd x.m.' : S==-1 ? 'Bad value' : S);
      //callAlert( S<0 ? '??' : new Date(2000,0,1,S[0],S[1]).USlocaltimeStr())
}

function f_isDateTimeLessThanTodayDateTime(sDate, sWorkTime, tzOffset) {
  var target = new Date(sDate + " " + convertToMilatary(sWorkTime));
  var targetMilli = target.getTime();
  var now = new Date();
  var nowMilli = now.getTime();
  if (tzOffset != undefined && tzOffset.length > 0) {
    var hours = parseInt(tzOffset) + now.getTimezoneOffset()/60; // tzOffset assumed negative
    nowMilli += hours*60*60*1000;
  }
  return (targetMilli < nowMilli);
}


/*
* Validates a form called "form", for use with the opt-in and preferences forms.
*  See form.xsl for only place this method is used
*/
function f_validateForm(a_sFormName)
{
   if (typeof(a_sFormName) == "undefined")
   {
      a_sFormName = "form";
   }
   var l_okay = true;
   var radioButtonSelected = false;
   var isEmailTypeRadio = false;

   for (var j=0; j < document.forms[a_sFormName].elements.length; j++)
   {
      var l_element = document.forms[a_sFormName].elements[j];
      f_useHiddenFieldIfCheckbox(l_element);

      var sFieldNameRequired = l_element.name + "_REQUIRED";
      //var elRequired = document.forms[a_sFormName].elements[sFieldNameRequired];
      var elRequired = getFormElementByName(a_sFormName,sFieldNameRequired);

      if ( l_element.value == "" &&
          ((elRequired && elRequired.value == "T") || l_element.getAttribute("required") == "T"))
      {
        alert("You must fill in all the required fields.");
        return;
      }

      // TT 28217 - check to make sure email type radio buttons at least have one selection
      if( (l_element.type == "radio" && l_element.name == "EMAIL_TYPE") &&
               ( (elRequired && elRequired.value == "T") || l_element.getAttribute("required") == "T") ) {
                // TT 30163 - need to add this to only perform this validation on email type radio box fields
                isEmailTypeRadio = true;
         if (l_element.checked) {
             radioButtonSelected = true;
         }
      }

      //text areas can only be 255 in size
      if(l_element.type == "textarea")
      {
         if (l_element.value.length > 4000)
         {
            alert("Please limit your entries to 4000 characters");
            return;
         }
      }
      var sFieldNameDataType = l_element.name + "_DATATYPE";
      //var elDataType = document.forms[a_sFormName].elements[sFieldNameDataType];
      var elDataType = getFormElementByName(a_sFormName,sFieldNameDataType);

      if (elDataType)
      {
         if (l_element.value != "")
         {
            if (elDataType.value == "time")
            {
               l_okay = f_isValidTime(l_element.value);
            }
            if (elDataType.value == "date")
            {
               l_okay = f_isValidDate(l_element.value);
            }
            if (elDataType.value == "numeric")
            {
               l_okay = f_isNumericWithDecimal(l_element.value);
            }
            if (elDataType.value == "email")
            {
               l_okay = f_isValidEmail(l_element.value);
            }
            if (elDataType.value == "smsOptedOut")
            {
              l_okay = f_isValidDateTime(l_element.value);
            }
            if (!l_okay)
            {
               l_element.focus();
               return;
            }
         }
      }
   }

   // after looping through everything, make sure the email type radio button has selection before submitting form
   // only if email type radio buttons are present.
   if(isEmailTypeRadio && !radioButtonSelected ) {
        alert("You must fill in all the required fields.");
        return;
   }

   document.forms[a_sFormName].submit();
}

/*
*  See form.xsl for only place this is used
*/
function f_initializeForm() {
   // Timezone offset to support send hour
   if (document.forms[0].tzOffset != undefined) {
       var now = new Date();
       var tzOffset = Math.floor(now.getTimezoneOffset() / 60);
       document.forms[0].tzOffset.value = tzOffset;

       var sendHourSelectName = document.forms[0].sendHourFieldName.value;
       var sendHourSelect = document.forms[0][sendHourSelectName];
       var selectedIndex = sendHourSelect.selectedIndex;
       // index 0 is "Select One"
       // index 1 is "Send Immediatly", which means send hour is 0
       // index 2-169 correspond to send hours 1-168
       if (selectedIndex > 1) {
           // The selected index is at a time slot, so it needs to be adjusted from
           // GMT into the browser's timezone.
           selectedIndex -= tzOffset;

           // Wrap around within range of 2-169
           if (selectedIndex <= 1) {
               selectedIndex += 168;
           } else if (selectedIndex > 169) {
               selectedIndex -= 168;
           }

           sendHourSelect.selectedIndex = selectedIndex;
       }
   }
}

/* checkboxes that have SYSTEM_ before their name should have an accompanying hidden
 field, that does not have the SYSTEM_.  This field should be "Yes" if the checkbox
 is checked, and "No" if it is not */
function f_useHiddenFieldIfCheckbox(a_element)
{
   if (a_element.type == "checkbox" && a_element.name.substring(0, 7) == "SYSTEM_")
   {
      //var hiddenElement = eval("document.form.elements['" + a_element.name.substring(7) +"']");
      var hiddenElement = getFormElementByName("form",a_element.name.substring(7));

      if (a_element.checked)
      {
         hiddenElement.value = "Yes";
      }
      else
      {
         hiddenElement.value = "No";
      }
   }
}

function callAlert(alertMessage)
{
    if (typeof spAlert == "undefined")
        alert(alertMessage);
    else
        spAlert(alertMessage);
}

function callAlertWithField(alertMessage, field)
{
    if (typeof spAlert == "undefined") {
        alert(alertMessage);
    }
    else {
        var okFunc = null;
        if (field) {
            okFunc = hitch({
                field: field,
                ok: function() {
                    this.field.focus();
                    this.field.select();
                }
            }, 'ok');
        }
    spAlert(alertMessage, null, null, null, null, okFunc);
    }
}

function getFormElementByName(formName,elementName)
{
      var elements = document.getElementsByName(elementName);
      var element;
      for (var j=0; j < elements.length; j++)
      {
         if ( elements[j].form && elements[j].form.attributes['name'].value == formName )
         {
            element = elements[j];
            break;
         }
      }
      return element
}
