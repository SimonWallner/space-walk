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

var samples = [];
var sampleCount = 0;
var fs = require('fs');

var strftime = require('strftime')

// options
// arg[0] is node
// arg[1] is the pwd
// hence we are interested in index > 1

if ((process.argv.indexOf('-h') > 1) || (process.argv.indexOf('--help') > 1)) {
	console.log('space walk recorder help:');
	console.log('The recorder records session data to a json file named automatically.');
	console.log('usage: ./recorder.js [flags]');
	console.log('\t -h \t this help message');
	console.log('\t -v \t verbose output');
	console.log('\t -d \t dry run, i.e. don\' write to the file system');
	process.exit();
}

var verbose = (process.argv.indexOf('-v') > 1);
if (verbose) {
	console.log('verbose!');
}

var dryRun = (process.argv.indexOf('-d') > 1);
if (dryRun) {
	console.log('This is a dry run, no data is saved to disk!!!');
}


console.log('starting recorder...');

var sessionStart = function() {
	console.log('session started');
}

var sessionEnd = function() {
	console.log('session ended');

	var fileName = strftime('%F_%H-%M-%S');

	if (!dryRun) {
		fs.writeFile('sessions/positions_' + fileName + '.json', JSON.stringify(samples, null, '\t'), function(err) {
			if (err) {
				console.log('error writing to file: ' + err);
			} else {
				console.log('+++ json file writte: ' + fileName);
			}
		})
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

			samples.push(JSON.parse(msg.data));
			sampleCount += 1;
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



