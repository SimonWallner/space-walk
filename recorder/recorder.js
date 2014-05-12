#! /usr/bin/env node

var connected = false;
var connecting = false;

var intervalHandle;

var host = '127.0.0.1';
var port = 60600
var sessionCloseTimeout = 5; // seconds

var lastDataReceivedTime = 0;
var sessionActive = false;

var WebSocket = require('ws');
var ws;

var sampleCount = 0;
var fs = require('fs');
var fileStream = null;

var path = require('path');

var strftime = require('strftime')

var commander = require('commander')
commander
	.version('dev snapshot')
	.option('-v, --verbose', 'verbose output')
	.option('-d, --dry-run', 'dry run, i.e. don\'t write to disk')
	.option('-o, --output-folder [folder]', 'output folder path')
	.option('-t, --timeout [seconds]', 'session timeout in seconds')
	.parse(process.argv);

var verbose = commander.verbose;
if (verbose) {
	console.log('verbose!');
}

var dryRun = commander.dryRun;
if (dryRun) {
	console.log('This is a dry run, no data is saved to disk!!!');
}

if (commander.outputFolder) {
	console.log('output folder is set to: ' + commander.outputFolder);
}

sessionCloseTimeout = commander.timeout || sessionCloseTimeout;
console.log('session timeout: ' + sessionCloseTimeout);

console.log('--- --- ---')
console.log('starting recorder...');

var sessionStart = function() {
	console.log('session started');

	if (!dryRun) {
		var fileName = 'data_' + strftime('%F_%H-%M-%S') + '.json';
		if (commander.outputFolder) {
			if (commander.outputFolder[0] === '/') { // absolute path
				var fullPath = path.join(commander.outputFolder, fileName);	
			} else {
				var fullPath = path.join(process.cwd(), commander.outputFolder, fileName);	
			}
		} else {
			var fullPath = path.join(process.cwd(), 'sessions', fileName);	
		}
		

		fileStream = fs.createWriteStream(fullPath, {flags: 'wx'});
		fileStream.on('error', function(error) {
			console.log('failed to open file: ' + fullPath);
			console.log(error);
		});

		fileStream.on('open', function() {
			console.log('output file opened (' + fullPath + ')');
		})

		fileStream.on('finish', function() {
			fileStream = null;
			console.log('finished writing to file');
		})

		// write header
		fileStream.write('[\n');
	}
}

var sessionEnd = function() {
	console.log('session ended');

	if (!dryRun) {
		fileStream.end(']\n')
	}

	samples = [];
	sampleCount = 0;
}

var keepAlive = function() {
	lastDataReceivedTime = new Date().getTime();
	
	if (sessionActive === false) {
		sessionStart();
	}

	sessionActive = true;
}


function connect() {
	if (!connected && !connecting) {
		connecting = true;

		url = 'ws://' + host + ':' + port;
		console.log("connecting to: " + url);

		ws = new WebSocket(url);
		
		ws.onopen = function(e) {
			console.log("connection to " + url + " established!");
			clearInterval(intervalHandle);
			connected = true;
			connecting = false;
		};
		
		ws.onerror = function(e) {
			connected = false;
			connecting = false;
		};
		
		ws.onclose = function(e) {
			if (connected = true) {
				console.log("connection to " + ws.URL + " closed!");
			}
			connected = false;
			connecting = false;
		};
		
		ws.onmessage = function(msg) {
			keepAlive();
			
			if (verbose) {
				console.log('message got: ' + msg.data);
			}

			sample = JSON.parse(msg.data);
			sampleCount += 1;

			if (!dryRun) {
				if (sampleCount == 1) {
					fileStream.write(JSON.stringify(sample, null, 4));	
				} else {
					var ok = fileStream.write(',\n' + JSON.stringify(sample, null, 4));
					if (!ok) {
						console.log('file stream is clogging up...');
					}	
				}
			}
		}
	}
}

setInterval(connect, 1000);

var checkSession = function() {
	if (sessionActive) {
		var now = new Date().getTime()
		if ((now - lastDataReceivedTime) > (sessionCloseTimeout * 1000)) {
			// close session
			console.log('session timed out');
			sessionActive = false;
			sessionEnd();
		}
	}
}

setInterval(checkSession, 1000);

var showProgress = function() {
	if (sessionActive) {
		console.log('samples received: ' + sampleCount);
	}
	else {
		console.log('waiting for session to begin');
	}
}

setInterval(showProgress, 3000);



