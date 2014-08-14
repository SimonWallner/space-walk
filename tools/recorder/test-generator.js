#! /usr/bin/env node

console.log('generating a total of 3 mil. samples in 20 categories')

var categories = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
	'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];


logIntervalHandle = setInterval(function() {
	var percentage = (count / total) * 100;
	console.log((count * 2) + ' (' + percentage.toFixed(2) + '%) samples written to file');
}, 1000);

var fs = require('fs');

var fileStream = fs.createWriteStream('test-data.json', {flags: 'w+'});
fileStream.on('error', function(err) {
	console.log('error writing to stream: ' + err);
});

fileStream.on('open', function() {
	console.log('output file opened');
});

fileStream.on('finish', function() {
	fileStream = null;
	console.log('finished writing to file');
	clearInterval(logIntervalHandle);
});

// write header
fileStream.write('[\n');

var start = new Date().getTime();

var count = 0;
var total = 3000000 / 20;

(function generate() {
	while (count < total) {
		count++;

		for (var i = 0; i < categories.length; i++) {
			fileStream.write(JSON.stringify({
				type: 'data',
				payload: {
					name: 'cat-' + i,
					reference: (new Date().getTime()) - start,
					value: 42
				}
			}, null, 4) + ',\n');
		}

		if (count < total) {
			var ok = fileStream.write(JSON.stringify({
					type: 'position',
					payload: {
						time: (new Date().getTime()) - start,
						x: 42,
						y: 43,
						z: 44
					}
				}, null, 4) + ',\n');
		} else { // last element, no comma
			var ok = fileStream.write(JSON.stringify({
				type: 'position',
				payload: {
					time: (new Date().getTime()) - start,
					x: 42,
					y: 43,
					z: 44
				}
			}, null, 4));
		}

		if (!ok) {
			fileStream.once('drain', generate);
			return;
		}

	}

	fileStream.end(']\n');
})();

