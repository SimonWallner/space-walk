var fs = require('fs')
var async = require('async');
var path = require('path');

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
	    	var data = JSON.parse(results[0]);
	    	var positions = data.filter(function(element) {
	    		return (element.type === 'position');
	    	})

	    	var speeds = []
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
	    		speeds.push(speed);
	    	}

	    	var csv = 'time, speed\n';
	    	for (var i = 0; i < speeds.length; i++) {
	    		csv += positions[i].payload.time + ', ' + speeds[i] + '\n';
	    	}

	    	callback({
				code: 200,
				data: csv,
				mime: 'text/csv'
			});
	    }
	});
}
