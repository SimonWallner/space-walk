#! /usr/bin/env node

var connected = false;
var connecting = false;
var socket = null;

var net = require('net');
var host = '127.0.0.1';
var port = 60601

var connectionPool = [];

var incomingMessageBuffer = "";

var connect = function() {
	if (connected || connecting) {
		return;
	}

	connecting = true;
	console.log("connecting...");

	var client = new net.Socket();
	client.connect(port, host, function() {
		connected = true;
		client.write('I am Chuck Norris!');
	});

	client.on('data', function(data) {
		// console.log('socket data: ' + data);

		incomingMessageBuffer += data;
		// console.log("buffer init: " + incomingMessageBuffer);
		var split = incomingMessageBuffer.split("\n");

		// console.log("split length pre: " + split.length);
		
		if (incomingMessageBuffer.substr(incomingMessageBuffer.length - 1) === "\n") {
			incomingMessageBuffer = "";
			split.pop(); // the last element is empty if we end the string on the delimiter
		} else {
			incomingMessageBuffer = split.pop();
		}

		// console.log("split length post: " + split.length);

		for (var i = 0; i < split.length; i++) {
			// console.log("parsing: " + split[i]);
			var foo = JSON.parse(split[i]);
	
			// relay messages to websocket
			for (var j = 0; j < connectionPool.length; ++j) {
				connectionPool[j].sendUTF(JSON.stringify(foo));
			}
		}
	});

	client.on('close', function() {
	    console.log('Connection closed');
	    connected = false;
	    connecting = false;
	});

	client.on('error', function(err) {
		console.log('error occured: ' + err);
		connected = false;
		connecting = false;
	});
	
}

setInterval(connect, 1000);


var WebSocketServer = require('websocket').server;
var http = require('http');

var server = http.createServer(function(request, response) {
	console.log((new Date()) + ' Received request for ' + request.url);
	response.writeHead(404);
	response.write('nothing to see here');
	response.end();
});

server.listen(60600, function() {
	console.log((new Date()) + ' Websocket Server is listening on port 60600');
});

wsServer = new WebSocketServer({
	httpServer: server,
	autoAcceptConnections: false
});

wsServer.on('request', function(request) {
	var connection = request.accept('', request.origin);
	connectionPool.push(connection);
	console.log('connection added. Pool length: ' + connectionPool.length);
});



