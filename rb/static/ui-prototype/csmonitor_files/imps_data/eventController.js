var startHoverTime;
var eventAnchors = {};
var hoverEventTypeId = '1';
var scrollUpEventTypeId = '2';
var scrollDownEventTypeId = '3';
var previousFoldableContentId = 'foldableContent_0_0';

function isMouseLeaveOrEnter(event, handler) 
{ 
	if (event.type != 'mouseout' && event.type != 'mouseover') 
		return false; 
	var reltg = event.relatedTarget ? event.relatedTarget : event.type == 'mouseout' ? event.toElement : event.fromElement; 
	while (reltg && reltg != handler) 
		reltg = reltg.parentNode; 
	return (reltg != handler); 
}

function setStartHoverEvent(event, handler) {
	if (isMouseLeaveOrEnter(event, handler))
	{
		startHoverTime = (new Date()).getTime();
	}
}

function setEndHoverEvent(event, handler, appId, zid, adId, zoneId) {
	eventTimeStamp = (new Date()).getTime();
	if (isMouseLeaveOrEnter(event, handler) && (eventTimeStamp >= startHoverTime + eventTimeThresholdInMs))
	{
		setHoverEventServerRequest(appId, zid, adId, zoneId, eventTimeStamp);
	}
}

function expandAd(event, handler, foldableContentId) 
{
	//setStartHoverEvent(event, handler);
	var foldableContent = document.getElementById(foldableContentId);
	//foldableContent.style.height = "80px";
	foldableContent.style.display = "inline";
}

function collapseAd(event, handler, appId, zid, adId, zoneId, foldableContentId) 
{
	//setEndHoverEvent(event, handler, appId, zid, adId, zoneId);
	if (foldableContentId != previousFoldableContentId) {
		var foldableContent = document.getElementById(previousFoldableContentId);
		previousFoldableContentId = foldableContentId;
		//foldableContent.style.height = "30px";
		foldableContent.style.display = "none";
	}
}


function setServerRequest(eventParams) {
	var ajaxRequest;
	try {
		ajaxRequest = new XMLHttpRequest();
	} catch(e) {
		try {
			ajaxRequest = new ActiveXObject("Msxml2.XMLHTTP");
		} catch(e) {
			try {
				ajaxRequest = new ActiveXObject("Microsoft.XMLHTTP");
			} catch(e) {
				return false;
			}
		}
	}
	ajaxRequest.open("POST", "/events.php", true);
	ajaxRequest.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	ajaxRequest.setRequestHeader("Content-length", eventParams.length);
	ajaxRequest.setRequestHeader("Connection", "close");
	ajaxRequest.send(eventParams);
}

function setHoverEventServerRequest(appId, zid, adId, zoneId, eventTimeStamp)
{
	var eventParams = encodeURI ("appId="  + appId + "&zid=" + zid + "&adId=" + adId + "&zoneId=" + zoneId + 
			"&duration=" + (eventTimeStamp - startHoverTime) + "&eventType=" + hoverEventTypeId);
	setServerRequest(eventParams);
}

function setScrollEventServerRequest(scrollEventTypeId, appId, zid, adId, zoneId)
{
	var eventParams = encodeURI ("appId="  + appId + "&zid=" + zid + "&adId=" + adId + "&zoneId=" + zoneId + 
			"&eventType=" + scrollEventTypeId);
	setServerRequest(eventParams);
}

function setScrollEvent(event, scrollableAreaElement, appId, zid, adId, zoneId) 
{
	if (adId in eventAnchors && !eventAnchors[adId]['isScrollUpEventSent'] &&
			(eventAnchors[adId]['previousScrollXPos'] > scrollableAreaElement.scrollTop)) {
		setScrollEventServerRequest(scrollUpEventTypeId, appId, zid, adId, zoneId);
		eventAnchors[adId]['isScrollUpEventSent'] = true;
	}
	else if (!(adId in eventAnchors)) {
		eventAnchors[adId] = {};
		setScrollEventServerRequest(scrollDownEventTypeId, appId, zid, adId, zoneId);
		eventAnchors[adId]['isScrollUpEventSent'] = false;
	}
	eventAnchors[adId]['previousScrollXPos'] = scrollableAreaElement.scrollTop;
}
