var playerTPL = '<i class="caPlayer" id="audiomack-embed">' +
	'<a href="http://www.audiomack.com" class="plogo" target="_blank">Audiomack</a>' +
	'<i class="border"><a href="#" class="ps paused"></a></i>' +
	'<i class="pinfo"><span class="pband"></span><span class="psong"></span></i>' +
	'<i class="next"></i>' +
	'<i class="prev"></i>' +
	'<i class="vol"><i class="bg"><i class="bar"></i></i><i class="icon-volume-up volicon"></i></i>' +
	'<i class="progressbar">' +
			'<i class="currentTime">00:00</i>' +
			'<i class="bar">' +
					'<i class="barPlaying"><i></i></i>' +
					'<i class="barLoading"></i>' +
			'</i>' +
			'<i class="totalTime">00:00</i>' +
	'</i>' +
'</i>';

var skinCSSRules = [
	'.caPlayer .paused',
	'.caPlayer .progress .bar .barPlaying',
	'.caPlayer .vol .bar',
	'.caPlayer .played'
];
var skinCSSRulesMainBGH = ['.caPlayer .ps'];
var skinCSSRulesMainBG = ['.caPlayer'];
var skinCSSRulesVolumeBG = ['.caPlayer .vol .bar i','.caPlayer .vol'];
var skinCSSRulesTextColor = ['.caPlayer .progressbar .currentTime','.caPlayer .progressbar .totalTime'];
var sounds = [];
var vol = 100;

$(document).ready(function() {
		soundManager.setup({url: '/cap/swf/', preferFlash: false, onready: initSounds});
});

function pausePlaying() {
	var id = this.id;
	$("#" + id + " .ps").removeClass('played').addClass('paused').trigger('touchend');
}

function finishPlaying() {
	var id = this.id;
	$("#" + id + " .ps").removeClass('played').addClass('paused');
	$("#" + id + " .next").trigger('click', [true]);
}

function startPlaying() {
	var id = this.id;
	$("#" + id + " .ps").removeClass('paused').addClass('played').trigger('touchend');

	var playlist = $("div[for="+id+"] div.song");

	if(playlist.length > 0 && $("div[for="+id+"] div.song.play").length == 0) {
		$(playlist[0]).toggleClass('play', true);
	}

	if(typeof ga != 'undefined') {
		ga('send', 'event', { eventCategory: 'Video Plays', eventAction: this.url.split('?')[0], eventLabel: window.location.href});
	}
	trackEvent('play', m, statToken);

	soundManager.setVolume(id, parseInt(vol));
}

function initSounds() {
	$("audio").each(function() {
		var id = $(this).attr('id');
		var url = $(this).attr('src');

		var firstColor     = $(this).data('firstColor');
		var secondColor    = $(this).data('secondColor');
		var trackTitle     = $(this).data('title');
		var trackPerformer = $(this).data('performer');
		var trackCount     = $(this).data('count');
		var trackCountLink = $(this).data('countLink');
		var trackRank      = $(this).data('rank');
		var trackRankLink  = $(this).data('rankLink');
		var trackURL       = $(this).data('url');
		var canDownload    = $(this).data('canDownload');
		var embedInput     = $(this).data('embed');

		applySkinColor(id, firstColor, secondColor);
		setTrackInfo(id, trackTitle, trackPerformer, trackCount, trackCountLink, trackRank, trackRankLink, trackURL, canDownload, embedInput);
		setBottomClicks();
		bindEvents(id);
		$("#" + id).data('url', url);
	});
}

function bindEvents(id) {
	$("#" + id + " .ps").click(play);
	$("#" + id + " .vol").click(volume);
	$("#" + id + " .progressbar").click(progress);

	var playlist = $("div[for="+id+"] div.song");

	if(playlist.length > 0) {
		$(playlist).click(playSong);

		$("#" + id + " .prev").show().click(prevSong);
		$("#" + id + " .next").show().click(nextSong);
	}

	// make sure download song link, if it exists, does not trigger parent click event
	$(".song .download-song a").click(function(e) {
		e.stopPropagation();
		ga('send', 'event', { eventCategory: 'Track Downloads', eventAction: $(this).attr('href').split('?')[0], eventLabel: window.location.href});

		var tn = $(this).parents('.song').children('.title').children('a').text();

		setTimeout(function() {recordTrackDl(tn)}, 250);
	});
}

function playSong(e, programmatic) {
	e.stopPropagation();
	e.preventDefault();

	var id = $(this).parents('#playlist').attr('for');
	var url = $(this).find('a').data('url');

	if(!soundManager.getSoundById(id)) {
		// avoid iOS wankery that thinks we're autoplaying shit for no reason
		var soundConfig = {
			id: 'testsound',
			url: '/point1sec.mp3',
			onpause: pausePlaying,
			onfinish: finishPlaying,
			onplay: startPlaying,
			onresume: startPlaying,
			whileplaying: progressPlaying,
			whileloading: progressLoading,
			multiShot: false,
			stream: true,
			autoLoad: true
		};

		soundManager.createSound(soundConfig);
		// end iOS wankery avoidance
	}

	initSound(id, url, true);

	$(this).parents('#playlist').find("div.song").removeClass('play');
	$(this).addClass('play');

	if($("#playlist")) {
		$("#playlist").scrollTo(this);

		if(!programmatic) {
			var $tag = $("#cmn_ad_tag_head");
			$tag.css('min-height', $tag.height());
			$tag = $(".boxad:eq(0)");
			$tag.css('min-height', $tag.height());
			$tag = $(".160adunit-songs:eq(0)");
			$tag.css('min-height', $tag.height());
			writeCaptureRefresh();
			ga('send', 'event', { eventCategory: 'Ad Refresh - Album Playlist', eventAction: url.split('?')[0], eventLabel: window.location.href});
		}
	}

	return false;
}

function initSound(id, url, play_on_load) {
	var soundConfig = {
		id: id,
		url: url,
		onpause: pausePlaying,
		onfinish: finishPlaying,
		onplay: startPlaying,
		onresume: startPlaying,
		whileplaying: progressPlaying,
		whileloading: progressLoading,
		multiShot: false,
		stream: true,
		autoLoad: true
	};

	if(play_on_load) {
		soundConfig.autoPlay = true;
	}

	if(url.match(/^https?:\/\/(www\.)?soundcloud\.com/)) {
		var consumer_key = "2dc3677b089ef176d23580678f522ba2";

		$.getJSON('https://api.soundcloud.com/resolve?url=' + url + '&format=json&consumer_key=' + consumer_key + '&callback=?', function(track) {
			if(track.streamable) {
				url = track.stream_url;
				(url.indexOf("secret_token") == -1) ? url = url + '?' : url = url + '&';
				url = url + 'consumer_key=' + consumer_key;

				soundConfig.url = url;
				soundManager.destroySound(id);
				soundManager.createSound(soundConfig);

				$.event.trigger({
					type: 'sm2-sound-ready',
					sm2_sound_id: id
				});

				if($("#sc-attribution")) {
					$("#sc-attribution").remove();
				}
				$("<div id='sc-attribution'>via <a href='" + track.permalink_url + "' target='_blank'>SoundCloud</a></div>").appendTo('.pbottom');
			}
		});
	} else if(url.match(/api\/music\/url\//)) {
		$.ajax({
			url: url,
			type: 'GET',
			cache: false,
			dataType: 'json',
			error: function(xhr, status, error) {
				var data = $.parseJSON(xhr.responseText);

				if(data.message) {
					alert(data.message);
				} else {
					alert(error);
				}
			},
			success: function(data, status, xhr) {
				soundConfig.url = data.url;
				soundManager.destroySound(id);
				soundManager.createSound(soundConfig);

				$.event.trigger({
					type: 'sm2-sound-ready',
					sm2_sound_id: id
				});
			}
		});
	} else {
		soundManager.destroySound(id);
		soundManager.createSound(soundConfig);
	}
}

function applySkinColor(id, firstColor, secondColor) {
	$("#"+id).replaceWith($(playerTPL).attr('id',id));

	$('.slim .icon-download-alt').removeClass('icon-white');
	$('.slim .btn').removeClass('btn btn-mini btn-warning').addClass('prank minidwnld').append(' <i class="pdot">.</i>').show();

	$('.pband, .pcount').css('color', secondColor);
	$('.plink, .pembed, .prank, .pcount').css('color', secondColor).on({
		mouseenter: function() {
			$(this).css('color',firstColor)
		},
		mouseleave: function() {
			$(this).css('color',secondColor)
		}
	});

	$('.caPlayer .ps').on({
		touchstart: function() {
			$('.caPlayer .ps').off('mouseenter,mouseleave');
			$(this).css('background-color', '#5f5f5f')
		},
		touchend: function() {
			$(this).css('background-color', firstColor)
		},
		touchcancel: function() {
			$(this).css('background-color', firstColor)
		}
	});

	$('.caPlayer .ps').css('background-color', firstColor).on({
		mouseenter: function() {
			$(this).css('background-color', '#5f5f5f')
		},
		mouseleave: function() {
			$(this).css('background-color', firstColor)
		}
	});

	$('.caPlayer .progressbar .bar .barPlaying, .caPlayer .vol .bar ').css('background-color',firstColor);
	$('.progressbar .bar, .caPlayer .vol .bg').css('background-color',secondColor);
	$('.pright .btn').css('background', firstColor);
	$('.psong, .index, .pdot').css('color', firstColor);


	$('.pright .btn').hover(function(){
		$(this).css('background', secondColor)
	},function(){
		$(this).css('background', firstColor)
	});
}

function setTrackInfo(id, trackTitle, trackPerformer, trackCount, trackCountLink, trackRank, trackRankLink, trackURL, canDownload, embedInput) {
	$('.pinfo').attr('href', trackURL);
	$('.pband').text(trackPerformer);
	$('.psong').text(trackTitle);
	$('.pcount strong').text(trackCount).parent().attr('href', trackURL);
	$('.prank strong').text(trackRank);
	$('.prank').attr('href', trackRankLink);
	$('.pright .dl').attr('href', trackURL);
	$('.embedfield input').attr('value', embedInput);
}

function setBottomClicks() {
	$('.plink').click(function() {
		$('.embedfield').removeClass('shown');
		$('.psocial').toggleClass('shown');
	});

	$('.pembed').click(function() {
		$('.psocial').removeClass('shown');
		$('.embedfield').toggleClass('shown');
	});

	$('.closeit').click(function() {
		$('.embedfield, .psocial').removeClass('shown');
	});
}

function volume(e) {
	var fullwidth = $(this).width();
	var id = $(this).parent().attr('id');
	vol = (e.pageX - $(this).offset().left) / fullwidth * 100;

	if(vol < 0)  { vol = 0; }
	if(vol > 95) { vol = 100; }

	soundManager.setVolume(id, parseInt(vol));
	var width = parseInt(fullwidth*(vol/100));

	$("#" + id + " .vol .bar").css('width', width + "px");
}

function progress(e) {
	var id = $(this).parent().attr('id');
	var x = e.pageX - $(".bar", this).offset().left;
	var duration = soundManager.getSoundById(id).durationEstimate;
	var min = 0;
	var max = $(".bar", this).width();
	var pos = 0;

	if ( x < min) {
		pos = 0;
	} else if ( x > max) {
		pos = 1;
	} else {
		pos = ( x - min ) / max;
	}

	soundManager.setPosition(id,parseInt(pos*duration));
	soundManager.play(id);
}

function play(e) {
	e.preventDefault();

	var id = $(this).parents('.caPlayer').attr('id');

	if(!soundManager.getSoundById(id)) {
		// avoid iOS wankery that thinks we're autoplaying shit for no reason
		var soundConfig = {
			id: 'testsound',
			url: '/point1sec.mp3',
			onpause: pausePlaying,
			onfinish: finishPlaying,
			onplay: startPlaying,
			onresume: startPlaying,
			whileplaying: progressPlaying,
			whileloading: progressLoading,
			multiShot: false,
			stream: true,
			autoLoad: true
		};

		soundManager.createSound(soundConfig);
		// end iOS wankery avoidance

		initSound(id, $(this).parents('.caPlayer').data('url'), true);
	} else if( $(this).hasClass('paused') ) {
		soundManager.play(id);
	} else {
		soundManager.pause(id);
	}
}

function nextSong(e, programmatic) {
	e.preventDefault();
	e.stopPropagation();

	var id = $(this).parents('.caPlayer').attr('id');

	var current = $("div[for="+id+"] div.song.play");
	var nextSong = current.next();

	if(!current) {
		$("div[for="+id+"] div.song:first-child").click();
	} else if(nextSong.hasClass('song')) {
		if(programmatic) {
			nextSong.trigger('click', [true]);
		} else {
			nextSong.click();
		}
	} else if(programmatic && !nextSong.hasClass('song')) {
		ga('send', 'event', { eventCategory: 'Reached End of Album', eventAction: window.location.href});
	}
}

function prevSong(e) {
	e.preventDefault();
	e.stopPropagation();

	var id = $(this).parents('.caPlayer').attr('id');

	var current = $("div[for="+id+"] div.song.play");
	var prevSong = current.prev();

	if(!current) {
		$("div[for="+id+"] div.song:last-child").click();
	} else if(prevSong.hasClass('song')) {
		prevSong.click();
	}
}

function progressLoading() {
	var id = this.id;

	var current = (this.bytesLoaded/this.bytesTotal) * 100;
	$("#" + id + " .barLoading").css( 'width', current +'%');
}

function progressPlaying() {
	var id = this.id;

	var current = (this.position/this.durationEstimate)*100;
	$("#" + id + " .barPlaying").css( 'width', current +'%');
	$("#" + id + " .currentTime").html(ms2time(this.position));
	$("#" + id + " .totalTime").html(ms2time(this.durationEstimate));
}

function ms2time(ms) {
	var sec = parseInt(ms/1000);
	var min = parseInt(sec/60)
	var sec = sec % 60;

	return min + ":" + ( sec < 10 ? '0' + sec : sec);
}

function recordDl() {
	trackEvent('dl', m, statToken);
}

function recordTrackDl(tn) {
	trackEvent('tdl', m, statToken, tn);
}

function trackEvent(s, m, t, tn) {
	$.ajax({
		url: '/stats',
		data: {s: s, m: m, t: t, tn: tn},
		type: 'POST'
	});
}

$.fn.scrollTo = function( target, options, callback ){
	if(typeof options == 'function' && arguments.length == 2){ callback = options; options = target; }
	var settings = $.extend({
		scrollTarget  : target,
		offsetTop     : 100,
		duration      : 500,
		easing        : 'swing'
	}, options);
	return this.each(function() {
		var scrollPane = $(this);
		var scrollTarget = (typeof settings.scrollTarget == "number") ? settings.scrollTarget : $(settings.scrollTarget);
		var scrollY = (typeof scrollTarget == "number") ? scrollTarget : scrollTarget.offset().top + scrollPane.scrollTop() - scrollPane.offset().top - parseInt(settings.offsetTop);
		scrollPane.animate({scrollTop : scrollY }, parseInt(settings.duration), settings.easing, function() {
			if (typeof callback == 'function') { callback.call(this); }
		});
	});
}
