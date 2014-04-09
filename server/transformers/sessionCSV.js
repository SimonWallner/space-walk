var fs = require('fs')
var async = require('async');
var path = require('path');

exports.mime = "text/csv";

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
	    	callback({
				code: 200,
				data: "OK" + results
			});
	    }
	});
}
