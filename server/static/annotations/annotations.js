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

var trt = null;

var svg = null;
var width = null;
var height = 200;
var margin = 40;

var video;
var duration = 0;

var toHumanReadableTime = function(s) {
	var hours = Math.floor(s / 3600);
	var minutes = Math.floor((s % 3600) / 60)
	var seconds = s % 60;
	return hours + ':' + minutes + ':' + seconds.toFixed(2);
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
	.range([margin, width - 2 * margin]);

	var y = d3.scale.linear()
		.range([margin, margin + 1]);

	var xAxis = d3.svg.axis()
	    .scale(x)
	    	.orient("bottom")
	    	.tickSize(height - 2*margin)
			.tickFormat(toHumanReadableTime)
			.ticks(7);


	svg = d3.select('#plots').append('svg')
		.attr('width', width)
		.attr('height', height);

	var g = svg.append("g");
		// .attr("transform", "translate(0, " + margin + ")");

	video.addEventListener('loadedmetadata', function() {
    	duration = video.duration;
    	x.domain([0, duration]);
		y.domain([0, 1]);

		svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + margin + ")")
			.call(xAxis);

		$.get('/data/sessionCSV/' + QueryString.dataset + '/annotations.json', function(data) {
			annotations = data;

			g.selectAll(".bar")
				.data(annotations.annotations)
					.enter().append("rect")
						.attr('class', 'bar')
						.attr('x', function(d) { return x(toSeconds(d.start)); })
						.attr('width', function(d) { return x(toSeconds(d.start) + toSeconds(d.end)); })
						.attr('y', function(d, i) { return  y(i * 20); })
						.attr('height', 18)
						.attr('data-startTime', function(d) { return toSeconds(d.start); })
						.attr('data-endTime', function(d) { return toSeconds(d.end); })
						.on('click', function(){
							var seconds = d3.select(this).attr('data-startTime')
							gotoVideo(seconds);
						});
		})
	});
}

$('document').ready(init)
