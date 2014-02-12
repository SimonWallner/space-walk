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
var fs = require('fs');

console.log('startgin recorder...');

var sessionStart = function() {
	console.log('session started');
}

var sessionEnd = function() {
	console.log('session ended');
	fs.writeFile('sessions/raw ' + Date() + '.json', JSON.stringify(samples), function(err) {
		if (err) {
			console.log('error writing to file: ' + err);
		} else {
			console.log('+++ json file written.');
		}
	})
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
			console.log('message got: ' + msg.data);
			samples.push(msg.data);
		}
	}
}

setInterval(connect, 100);

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



