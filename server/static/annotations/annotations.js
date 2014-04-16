var annotations = null;
var runningID = 0;
var offsetIncrement = 0.5;

removeElement = function(needle, haystack) {
	for (var i = 0; i < haystack.length; i++) {
		if (haystack[i].id === needle) {
			haystack.splice(i, 1);
			break;
		}
	}
}

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


	video.addEventListener('loadedmetadata', function() {
		duration = video.duration;
		
		$.get('/data/sessionCSV/' + QueryString.dataset + '/annotations.json', function(data) {
			annotations = data;

			$('#offset').val(annotations.offset);

			annotations.annotations = annotations.annotations.map(function(element) {
				element.id = runningID++;
				return element;
			})

			var x = d3.scale.linear()
				.range([0, width])
				.domain([0, duration]);

			var createEntry = function(selection) {
				selection
					.attr('class', 'entry')
					.attr('data-startTime', function(d) { return toSeconds(d.start); })
					.attr('data-endTime', function(d) { return toSeconds(d.end); })
					.on('click', function(){
						var seconds = d3.select(this).attr('data-startTime')
						gotoVideo(seconds);
					})
					.append('div')
						.attr('class', 'bar')
						.style('width', function(d) { return x(toSeconds(d.end) - toSeconds(d.start)) + 'px'; })
						.style('margin-left', function(d) { return x(toSeconds(d.start)) + 'px'; });

				selection.append('div')
					.text(function(d) { return d.annotation + ' - ' + d.group; })
					.append('a')
						.attr('href', '#')
						.text(' remove')
						.on('click', function(d) {
							removeElement(d.id, annotations.annotations);
							updateData();
						})
			}

			var div = d3.select('#annotations');

			var updateData = function() {
				var selection = div.selectAll(".entry").data(annotations.annotations, function(d) { return d.id; });
				// selection.call(createEntry);
				selection.enter().append("div")
					.call(createEntry);
				selection.exit().remove();
			}

			updateData();

			$('#addAnnotation').click(function() {
				annotations.annotations.push({
					start: toTimeObject($('#start').val()),
					end: toTimeObject($('#end').val()),
					annotation: $('#annotation').val(),
					group: $('#group').val(),
					id: runningID++
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

	$.get('/data/sessionCSV/' + QueryString.dataset + '/data.json', function(data) {
		var plots = d3.select('#plots');

		var positions = data.filter(function(element) {
			return (element.type === 'position');
		});

		// get min/max values
		var minT = positions[0].payload.time;
		var maxT = positions[positions.length - 1].payload.time;

		extendedWidth = 8 * width;
		var margin = {top: 20, right: 10, bottom: 20, left: 10};
		var innerWidth = extendedWidth - margin.left - margin.right;
		var innerHeight = height - margin.top - margin.bottom;

		var svg = plots.append('svg')
			.attr('width', extendedWidth)
			.attr('height', height);

		var g = svg.append('g')
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		var x = d3.scale.linear()
			.range([0, innerWidth])
			.domain([minT, maxT]);

		var y = d3.scale.linear()
			.range([0, innerHeight])
			.domain(d3.extent(positions, function(d) {return d.payload.x; }));

		var line = d3.svg.line()
			.x(function(d) { return x(d.payload.time); })
			.y(function(d) { return y(d.payload.x); });


		var xAxis = d3.svg.axis()
			.scale(x)
			.orient("bottom")
			.ticks(40);

		 g.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + innerHeight + ")")
			.call(xAxis);

		g.append("path")
			.datum(data)
				.attr("class", "line")
				.attr("d", line);

		var playHead = g.append('line')
			.attr('class', 'hover-line')
			.attr('x1', 20).attr('x2', 20)
			.attr('y1', 2)// prevent touching x-axis line
			.attr('y2', height + 20)
			.attr('stroke-width', 1)
			.attr('stroke', 'red')
			.attr('opacity', 1);

		var movePlayhead = function() {
			if (video) {
				playHead
					.attr('x1', x(video.currentTime + annotations.offset))
					.attr('x2', x(video.currentTime + annotations.offset));
			}
		}

		window.setInterval(movePlayhead, 1000);

		$('#offsetPlus').click(function() {
			annotations.offset += offsetIncrement;
			$('#offset').val(annotations.offset);
		})

		$('#offsetMinus').click(function() {
			annotations.offset -= offsetIncrement;
			$('#offset').val(annotations.offset);
		})

		var hoverLine = g.append('line')
			.attr('class', 'hover-line')
			.attr('x1', 20).attr('x2', 20)
			.attr('y1', 2)// prevent touching x-axis line
			.attr('y2', height + 20)
			.attr('stroke-width', 1)
			.attr('stroke', 'grey')
			.attr('opacity', 1e-6);

		svg.on('mouseover', function () {
			var mouse = d3.mouse(this);
			var mX = mouse[0] - margin.left, mY = mouse[1] - margin.top;

			if (mX > 0 && mY > 0 && mX < extendedWidth)                    
				hoverLine.style('opacity', 1);                
			else
				hoverLine.style("opacity", 1e-6);
			})
			.on('mouseout', function () {
				hoverLine.style("opacity", 1e-6);
			})
			.on('mousemove', function () {
				var mouse = d3.mouse(this);
				var mX = mouse[0] - margin.left, mY = mouse[1] - margin.top;
				hoverLine.attr('x1', mX).attr('x2', mX);
			})
			.on('click', function () {
				var mouse = d3.mouse(this);
				var mX = mouse[0] - margin.left, mY = mouse[1] - margin.top;
				var time = x.invert(mX);
				video.currentTime = time - annotations.offset;
				console.log(time);
			});	
	});

	$('#save').click(function() {
		if (annotations) {
			var path = '/sessionCSV/' + QueryString.dataset + '/annotations.json'
			// var path = '/test'
			$.ajax(path, {
				method: 'PUT',
				data: {data: JSON.stringify(annotations)},
				success: function(response) {
					console.log('annotations saved: ' + response);
				},
				error: function(err) {
					alert('failed to save annotations on server: ' + err);
				}
			})
		}
	})
}

$('document').ready(init)
