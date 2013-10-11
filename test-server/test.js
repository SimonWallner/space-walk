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

setInterval(function() {
	for (var i = 0; i < connectionPool.length; ++i) {
		connectionPool[i].sendUTF(JSON.stringify({
				time: new Date().getMilliseconds(),
				position: {
					x: Math.sin(new Date().getMilliseconds() / 1000),
					y: Math.cos(new Date().getMilliseconds() / 1000)
				}
			}));
	}
}, 100);
