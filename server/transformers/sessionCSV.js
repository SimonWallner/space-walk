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
	data.push({value: 42, time: Infinity});

	var j = 0; // index into the data array
	for (var i = 0 ; i < regularTimes.length; i++) {
		while (regularTimes[i] > data[j + 1].time) {
			j++;
		}
		var leftTime = data[j].time;
		var rightTime = data[j+1].time;

		var time = regularTimes[i];
		if ((time - leftTime) < (rightTime - time)) {
			result.push(data[j].value);
		} else {
			result.push(data[j+1].value);
		}
	}

	return result;
}


var mapMix = function(ta, tb, va, vb, t) {
	r = (ta - t) / (ta - tb);
	return va * (1-r) + vb * r;
}

var regulariseLinear = function(regularTimes, data) {
	
	var result = [];

	// push an extra element to avoid falling off the edge
	data.push({value: 0, time: Infinity});

	var j = 0; // index into the data array
	for (var i = 0 ; i < regularTimes.length; i++) {
		while (regularTimes[i] > data[j + 1].time) {
			j++;
		}
		var leftTime = data[j].time;
		var rightTime = data[j+1].time;
		var leftValue = data[j].value;
		var rightValue = data[j+1].value;

		var time = regularTimes[i];
		result.push(mapMix(leftTime, rightTime, leftValue, rightValue, time));
	}

	return result;
}




exports.transformFolder = function(folderPath, response) {

	var dataPath = path.join(folderPath, 'data.json');
	var annotationsPath = path.join(folderPath, 'annotations.json');

	console.log('start reading file...');
	async.map([dataPath, annotationsPath], fs.readFile, function(err, results){
		if (err) {
				response.writeHead(500);
				response.end('Failed to load files.');
		} else {
			console.log('files read, starting parser...');
			var raw = JSON.parse(results[0]);
			console.log('data file parsed.')

			var data = {};
			var names = [];

			// positions
			console.log('processing positions');
			var positions = raw.filter(function(element) {
				return (element.type === 'position');
			})

			if (positions.length > 0) {
				names.push('positionX');
				names.push('positionY');
				names.push('positionZ');
				data.positionX = [];
				data.positionY = [];
				data.positionZ = [];
				positions.forEach(function(element) {
					data.positionX.push({value: element.payload.x, time: element.payload.time});
					data.positionY.push({value: element.payload.y, time: element.payload.time});
					data.positionZ.push({value: element.payload.z, time: element.payload.time});
				})
			
			
				// speed
				console.log('processing speed');
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
					data.speeds.push({value: speed, time: k.time});
				}

				// horizontal orientation, phi
				// vertical orienation, theta
				console.log('processing orientation');
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

					data.phi.push({value: p, time: k.time});
					data.theta.push({value: t, time: k.time});
				}
			}
			

			// misc data samples
			console.log('processing data samples');
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
			console.log('regularising data');

			// computing max sample rate
			var frameDelta = []
			raw.forEach(function(value, index) {
				if (index > 0) {
					var currentTime = value.payload.time || value.payload.time;
					var previousTime = raw[index-1].payload.time || raw[index-1].payload.time;
					var deltaT = currentTime - previousTime;

					if (deltaT !== 0) {
						frameDelta.push(deltaT);
					}
				}
			})

			var frameDeltaSorted = frameDelta.sort(function(a, b) {return a - b;});
			var dLimit = frameDeltaSorted[Math.floor(frameDeltaSorted.length * 0.05)];
			var fLimit = 1 / dLimit;
			console.log('95% F_limit estimate: ' + fLimit);
			console.log('90%: ' + 1 / frameDeltaSorted[Math.floor(frameDeltaSorted.length * 0.10)]);
			console.log('80%: ' + 1 / frameDeltaSorted[Math.floor(frameDeltaSorted.length * 0.20)]);
			console.log('50%: ' + 1 / frameDeltaSorted[Math.floor(frameDeltaSorted.length * 0.50)]);
			
			var sampleRate = Math.ceil(fLimit * 2);
			console.log('resampling rete set to: ' + sampleRate);

			var timeMin = raw[0].payload.time;
			var timeMax = raw[raw.length - 1].payload.time;
			var sampleCount = positions.length;
			data.time = linearData(timeMin, timeMax, (timeMax - timeMin) * sampleRate);

			regularisedData = {};
			names.forEach(function(name) {
				// XXX: Hack ahead!!!
				if (name === 'axis-0' || name === 'axis-1') {
					regularisedData[name] = regulariseLinear(data.time, data[name]);
				} else {
					regularisedData[name] = regulariseNearest(data.time, data[name]);
				}
			})

			// add time
			names.push('time')
			regularisedData.time = data.time;


	
			// ----- annotations ------
			var annotations = JSON.parse(results[1]);
			
			// expanding annotations
			console.log('processing annotations');
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
			console.log('processing groups');
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

			

			// writing csv string to reponse
			response.writeHead('200', {
				'Content-Type': 'text/csv',
				'Cache-Control': 'no-cache',
				'Accept-Ranges': 'none',
				'Content-disposition': 'attachment;filename=data.csv'
			});

			// sanitize field names
			var sanitizedNames = names.map(function(name) {
				return name.replace(/ /g, '_').replace(/\./g, '-');
			})

			// write header
			console.log('writing csv to response');
			response.write(sanitizedNames.join(', ') + '\n');

			for (var i = 0; i < regularisedData.time.length; i++) { // all data should be regralised by now
				var line = '';
				names.forEach(function(name, j) {
					line += regularisedData[name][i];
					if (j != names.length - 1) { // not at the last element yet
						line += ', ';
					}
				})

				line += '\n';
				response.write(line);
			}

			response.end();
			console.log('done, ' + regularisedData.time.length + ' data lines written to response');
		}
	});
}
