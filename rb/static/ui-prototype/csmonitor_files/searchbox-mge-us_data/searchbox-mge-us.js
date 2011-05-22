// JavaScript Document
var displayZip, formsent, defaultCityValuem, zip;

formsent = false;

defaultCityValue 	= 'Enter a City';

//Main validate function for the search boxes for MGE
function validateForm()
{
	thisform = document.forms[0];
	msg = "";
	if( typeof(thisform) == "undefined" )
	{
		return false;
	}
	
	if( thisform.elements['country'].value == '' )
	{
		msg += "Please provide where you live.\n";
	}
	if( thisform.elements['programcategory_id'].value == '' )
	{
		msg += "Please select an Education Type and Category.\n";
	}

	
	zip = dojo.query('#zip').attr('value')[0];
	if( displayZip && !(zip.length === 5 && is_int(zip) ) )
	{
		msg += 'Please enter a valid zip.\n';
	}

	if( msg != '' )
	{
		alert(msg);
		return false;
	}

	return true;
}

function is_int(value)
{
	if((parseFloat(value) == parseInt(value)) && !isNaN(value))
	{
		return true;
	} else
	{
		return false;
	}
}

dojo.addOnLoad(function(){
	
	dojo.connect( dojo.byId('country'), 'onchange', function(e){
		var selectBox, selectedIndex, country;
		selectBox = e.currentTarget;
		selectedIndex = selectBox.selectedIndex
		country = selectBox.options[selectedIndex].text;
		displayZip = country == 'United States';
		dojo.query('#zip_item').style('display', (displayZip ? 'block' : 'none') );
		if( !displayZip )
		{
			dojo.query('#zip_item').attr('value', '');
		}
	});
});

