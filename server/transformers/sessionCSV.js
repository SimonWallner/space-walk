var fs = require('fs')
var async = require('async');
var path = require('path');

var pushUnique = function(arr, element) {
	if (arr.indexOf(element) === -1) {
		arr.push(element);
	}
}

var toSeconds = function(s, m, h) {
	return s + m * 60 + h * 3600;
}

// creates an array of numbers in [min, max] of length count
// e.g: [0, 1, 2, 3] === linearData(0, 3, 4);
var linearData = function(min, max, count) {
	var length = max - min;
	var increment = length / (count - 1);

	var result = [];
	for (t = min; t <= max; t += increment) {
		result.push(t);
	}

	return result;
}

var regulariseNearest = function(regularTimes, data) {
	
	var result = [];

	// push an extra element to avoid falling off the edge
	data.push({value: 42, reference: Infinity});

	var j = 0; // index into the data array
	for (var i = 0 ; i < regularTimes.length; i++) {
		while (regularTimes[i] > data[j + 1].reference) {
			j++;
		}
		var leftTime = data[j].reference;
		var rightTime = data[j+1].reference;

		var time = regularTimes[i];
		if ((time - leftTime) < (rightTime - time)) {
			result.push(data[j].value);
		} else {
			result.push(data[j+1].value);
		}
	}

	return result;
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
			var names = [];

			// positions
			var positions = raw.filter(function(element) {
				return (element.type === 'position');
			})
			names.push('positionX');
			names.push('positionY');
			names.push('positionZ');
			data.positionX = [];
			data.positionY = [];
			data.positionZ = [];
			positions.forEach(function(element) {
				data.positionX.push({value: element.payload.x, reference: element.payload.time});
				data.positionY.push({value: element.payload.y, reference: element.payload.time});
				data.positionZ.push({value: element.payload.z, reference: element.payload.time});
			})

			
			// speed
			data.speeds = [];
			names.push('speeds');
			for (var i = 0; i < (positions.length - 1); i++) {
				var k = positions[i].payload;
				var l = positions[i+1].payload;
				var d = {
					x: k.x - l.x,
					y: k.y - l.y,
					z: k.z - l.z
				}

				var deltaT = l.time - k.time;
				var speed = Math.sqrt(d.x * d.x + d.y * d.y + d.z * d.z) / deltaT;
				data.speeds.push({value: speed, reference: k.time});
			}

			// horizontal orientation, phi
			// vertical orienation, theta
			data.phi = [];
			names.push('phi');
			data.theta = [];
			names.push('theta')
			for (var i = 0; i < (positions.length - 1); i++) {
				var k = positions[i].payload;
				var l = positions[i+1].payload;
				
				var d = { // direction
					x: l.x - k.x,
					y: l.y - k.y,
					z: l.z - k.z
				}
				var r = Math.sqrt(d.x * d.x + d.y * d.y + d.z * d.z);
				var t = Math.acos(d.y / r) || 0; // hint: y is up!
				var p = Math.atan(d.z / d.x) || 0;

				data.phi.push({value: p, reference: k.time});
				data.theta.push({value: t, reference: k.time});
			}

			

			// misc data samples
			var dataSamples = raw.filter(function(element) {
				return (element.type === 'data');
			});

			// extract names
			var dataAttributeNames = [];
			dataSamples.forEach(function(d) {
				pushUnique(dataAttributeNames, d.payload.name);
			});
			names = names.concat(dataAttributeNames);

			// create empty arrays
			dataAttributeNames.forEach(function(name) {
				data[name] = [];
			});

			// separate data
			dataSamples.forEach(function(sample) {
				data[sample.payload.name].push(sample.payload);
			});


			

			// regularise data now...
			// compute regular time samples
			var timeMin = positions[0].payload.time;
			var timeMax = positions[positions.length - 1].payload.time;
			var sampleCount = positions.length;
			data.time = linearData(timeMin, timeMax, sampleCount);

			regularisedData = {};
			names.forEach(function(name) {
				regularisedData[name] = regulariseNearest(data.time, data[name]);
			})

			// add time
			names.push('time')
			regularisedData.time = data.time;


	
			// ----- annotations ------
			var annotations = JSON.parse(results[1]);
			
			// expanding annotations
			var labels = [];
			for (var i = 0; i < annotations.annotations.length; i++) {
				var annotation = annotations.annotations[i];
				var start = annotations.offset + toSeconds(annotation.start.s, annotation.start.m, annotation.start.h);
				var end = annotations.offset + toSeconds(annotation.end.s, annotation.end.m, annotation.end.h);

				regularisedData[annotation.label] = [];
				labels.push(annotation.label);

				for (var j = 0; j < data.time.length; j++) {
					var time = data.time[j];
					regularisedData[annotation.label].push((start < time && time < end) ? 1 : 0);
				}	
			}
			names = names.concat(labels);
			
			// grouping annotations
			var groups = [];
			annotations.annotations.forEach(function(annotation) {
				pushUnique(groups, annotation.group);

				if (!regularisedData[annotation.group]) {
					regularisedData[annotation.group] = regularisedData[annotation.label];
				} else {
					regularisedData[annotation.group] = regularisedData[annotation.group].map(function(element, i) {
						return Math.max(element, regularisedData[annotation.label][i]);
					});
				}
			})
			names = names.concat(groups);

			

			// writing csv string
			// sanitize field names
			var sanitizedNames = names.map(function(name) {
				return name.replace(/ /g, '_').replace(/\./g, '-');
			})

			// write header
			var csv = sanitizedNames.join(', ') + '\n';

			for (var i = 0; i < regularisedData.time.length; i++) { // all data should be regralised by now
				names.forEach(function(name, j) {
					csv += regularisedData[name][i];
					if (j != names.length - 1) { // not at the last element yet
						csv += ', ';
					}
				})

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
