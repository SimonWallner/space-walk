#!/usr/bin/env node

var connectionPool = [];

var WebSocketServer = require('websocket').server;
var http = require('http');

var server = http.createServer(function(request, response) {
	console.log((new Date()) + ' Received request for ' + request.url);
	response.writeHead(404);
	response.write('nothing to see here');
	response.end();
});

server.listen(60600, function() {
	console.log((new Date()) + ' Server is listening on port 60600');
});

wsServer = new WebSocketServer({
	httpServer: server,
	autoAcceptConnections: false
});

wsServer.on('request', function(request) {
	var connection = request.accept('', request.origin);
	connectionPool.push(connection);
	console.log('connection added. Pool length: ' + connectionPool.length);
	// connection.sendUTF('test');

	// connection.on('message', function(message) {
 //        if (message.type === 'utf8') {
 //            console.log('Received Message: ' + message.utf8Data);
 //            connection.sendUTF(message.utf8Data);
 //        }
 //        else if (message.type === 'binary') {
 //            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
 //            connection.sendBytes(message.binaryData);
 //        }
});

var ConstrainedRandomWalk = function() {
	var position = 0;
	var speed = 0.1;
	
	this.get = function() {
		position = (position + (Math.random() * 2 - 1) * speed);

		if (position > 1) {
			position = 1 - (position - 1);
		} else if (position < -1) {
			position = -1 - (position + 1);
		}

		return position;
	}
}

var RandomWalk = function() {
	var lastPosition = {x: 0, y: 0};
	
	var randomX = new ConstrainedRandomWalk();
	var randomY = new ConstrainedRandomWalk();

	this.getWaypoint = function() {
		lastPosition.x += randomX.get();
		lastPosition.y += randomY.get();
		return lastPosition;
	}
}

// var foo = new ConstrainedRandomWalk();
// setInterval(function() {
// 	console.log(foo.get());
// }, 100)

var randomWalk = new RandomWalk();

setInterval(function() {
	for (var i = 0; i < connectionPool.length; ++i) {
		connectionPool[i].sendUTF(JSON.stringify({
				time: new Date().getMilliseconds(),
				position: randomWalk.getWaypoint()
			}));
	}
}, 7);
