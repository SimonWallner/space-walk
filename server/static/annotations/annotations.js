var annotations = null;


// code from http://stackoverflow.com/questions/979975/how-to-get-the-value-from-url-parameter
var QueryString = function () {
	// This function is anonymous, is executed immediately and 
	// the return value is assigned to QueryString!
	var query_string = {};
	var query = window.location.search.substring(1);
	var vars = query.split("&");
	for (var i=0;i<vars.length;i++) {
		var pair = vars[i].split("=");
			// If first entry with this name
		if (typeof query_string[pair[0]] === "undefined") {
			query_string[pair[0]] = pair[1];
			// If second entry with this name
		} else if (typeof query_string[pair[0]] === "string") {
			var arr = [ query_string[pair[0]], pair[1] ];
			query_string[pair[0]] = arr;
			// If third or later entry with this name
		} else {
			query_string[pair[0]].push(pair[1]);
		}
	} 
		return query_string;
}();

var toSeconds = function(obj) {
	return obj.s + obj.m * 60 + obj.h * 3600;
}

var toTimeObject = function(valueString) {
	if (valueString.length === 5) {
		valueString += ':00'; // fuck you chrome, omitting seconds whenever possible!
	}

	var arr = valueString.split(':');
	return {
		h: parseInt(arr[0]),
		m: parseInt(arr[1]),
		s: parseInt(arr[2])
	}
}

var trt = null;

var svg = null;
var width = null;
var height = 200;
var margin = 40;

var video;
var duration = 0;

var zeroLead = function(obj, length) {
	var string = obj.toString();
	while (string.length < length) {
		string = '0' + string;
	}
	return string;
}

var toHumanReadableTime = function(s) {
	var hours = Math.floor(s / 3600);
	var minutes = Math.floor((s % 3600) / 60);
	var seconds = Math.floor(s % 60);
	return zeroLead(hours, 2) + ':' + zeroLead(minutes, 2) + ':' + zeroLead(seconds, 2);
}


var gotoVideo = function(seconds) {
	video.currentTime = seconds;
}

var init = function() {
	d3.select('#video').append('video')
		.attr('src', '/data/sessionCSV/' + QueryString.dataset + '/screen-capture.mp4')
		.attr('controls', 'controls');

	video = $('video')[0];

	width = $('#container').width();

	var x = d3.scale.linear()
		.range([0, width]);

	var div = d3.select('#plots');

	video.addEventListener('loadedmetadata', function() {
    	duration = video.duration;
    	x.domain([0, duration]);

		$.get('/data/sessionCSV/' + QueryString.dataset + '/annotations.json', function(data) {
			annotations = data;

			var updateData = function() {
				div.selectAll(".bar")
					.data(annotations.annotations)
						.enter().append("div")
							.attr('class', 'bar')
							.style('width', function(d) { return x(toSeconds(d.end) - toSeconds(d.start)) + 'px'; })
							.style('height', '18px')
							.style('fill', 'yellow')
							.style('margin-left', function(d) { return x(toSeconds(d.start)) + 'px'; })
							.attr('data-startTime', function(d) { return toSeconds(d.start); })
							.attr('data-endTime', function(d) { return toSeconds(d.end); })
							.on('click', function(){
								var seconds = d3.select(this).attr('data-startTime')
								gotoVideo(seconds);
							});
			}
			updateData();

			$('#addAnnotation').click(function() {
				annotations.annotations.push({
					start: toTimeObject($('#start').val()),
					end: toTimeObject($('#end').val()),
					annotation: $('#annotation').val(),
					class: $('#annotation').val()
				})
				updateData();
			});

			$('#copyStart').click(function() {
				$('#start').val(toHumanReadableTime(video.currentTime));
			})
			$('#copyEnd').click(function() {
				$('#end').val(toHumanReadableTime(video.currentTime));
			})
		});
	});
}

$('document').ready(init)
