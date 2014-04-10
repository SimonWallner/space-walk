var fs = require('fs')
var async = require('async');
var path = require('path');

var pushUnique = function(arr, element) {
	if (arr.indexOf(element) == -1) {
		arr.push(element);
	}
}

var toSeconds = function(s, m, h) {
	return s + m * 60 + h * 3600;
}

exports.transformFolder = function(folderPath, callback) {

	var dataPath = path.join(folderPath, 'data.json');
	var annotationsPath = path.join(folderPath, 'annotations.json');

	async.map([dataPath, annotationsPath], fs.readFile, function(err, results){
		if (err) {
			callback({
				code: 500,
				data: "failed reading files: " + err
			});
		} else {
			var raw = JSON.parse(results[0]);

			var data = {};

			// positions
			data.positions = raw.filter(function(element) {
				return (element.type === 'position');
			})

			
			// speed
			data.speeds = []
			for (var i = 0; i < (data.positions.length - 1); i++) {
				var k = data.positions[i].payload;
				var l = data.positions[i+1].payload;
				var d = {
					x: k.x - l.x,
					y: k.y - l.y,
					z: k.z - l.z
				}

				var deltaT = l.time - k.time;
				var speed = Math.sqrt(d.x * d.x + d.y * d.y + d.z * d.z) / deltaT;
				data.speeds.push(speed);
			}

			// expanding annotations
			var labels = [];
			var annotations = JSON.parse(results[1]);
			for (var i = 0; i < annotations.annotations.length; i++) {
				var annotation = annotations.annotations[i];
				var start = toSeconds(annotation.start.s, annotation.start.m, annotation.start.h);
				var end = toSeconds(annotation.end.s, annotation.end.m, annotation.end.h);

				data[annotation.label] = [];
				labels.push(annotation.label);

				for (var j = 0; j < data.speeds.length; j++) {
					var time = data.positions[j].payload.time;
					data[annotation.label].push((start < time && time < end) ? 1 : 0);
				}	
			}
			
			// grouping annotations
			var groups = [];
			annotations.annotations.forEach(function(annotation) {
				pushUnique(groups, annotation.group);

				if (!data[annotation.group]) {
					data[annotation.group] = data[annotation.label];
				} else {
					data[annotation.group] = data[annotation.group].map(function(element, i) {
						return Math.max(element, data[annotation.label][i]);
					});
				}
			})

			// writing csv string
			var csv = 'time, x, y, z, speed';
			labels.forEach(function(label) {
				csv += ', ' + label;
			});
			groups.forEach(function(group) {
				csv += ', ' + group
			});

			csv += '\n'


			for (var i = 0; i < data.speeds.length; i++) {
				csv += data.positions[i].payload.time;
				csv += ', ' + data.positions[i].payload.x;
				csv += ', ' + data.positions[i].payload.y;
				csv += ', ' + data.positions[i].payload.z;
				csv += ', ' + data.speeds[i];

				labels.forEach(function(label) {
					csv += ', ' + data[label][i]
				});
				
				groups.forEach(function(group) {
					csv += ', ' + data[group][i]
				});
				csv += '\n'
			}

			callback({
				code: 200,
				data: csv,
				mime: 'text/csv'
			});
		}
	});
}
