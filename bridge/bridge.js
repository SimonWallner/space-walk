#! /usr/bin/env node

var connected = false;
var connecting = false;
var socket = null;

var net = require('net');
var host = '127.0.0.1';
var port = 60601

var connectionPool = [];

var incomingMessageBuffer = "";

var clientSocket = null;

var connect = function() {
	if (connected || connecting) {
		return;
	}

	connecting = true;
	console.log("socket connecting...");

	clientSocket = new net.Socket();
	clientSocket.connect(port, host, function() {
		connected = true;
		console.log('socket connection established');
	});

	clientSocket.on('data', function(data) {
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

	clientSocket.on('error', function(err) {
		console.log('socket error occured: ' + err);
		connected = false;
		connecting = false;
	});

	clientSocket.on('end', function() {
		console.log('socket connection ended.');
		connected = false;
		connecting = false;
	});

	clientSocket.on('timeout', function() {
		console.log('socket connection timed out.');
		connected = false;
		connecting = false;
	});

	clientSocket.on('close', function() {
		console.log('socket connection closed.');
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
	console.log('ws connection added. Pool length: ' + connectionPool.length);

	connection.on('message', function(msg) {
		var raw = msg.utf8Data;
		console.log('ws message got: ' + raw);
		clientSocket.write(raw);
	});

	connection.on('close', function() {
		console.log('ws client connection lost');

		for (var i = 0; i < connectionPool.length; i++) {
			if (connectionPool[i] === connection) {
				connectionPool.splice(i, 1);
			}
		}
	});

	connection.on('error', function() {
		console.log('ws client connection error');

		for (var i = 0; i < connectionPool.length; i++) {
			if (connectionPool[i] === connection) {
				connectionPool.splice(i, 1);
			}
		}
	});
});







// code taken from http://stackoverflow.com/questions/130404/javascript-data-formatting-pretty-printer
function DumpObject(obj)
{
  var od = new Object;
  var result = "";
  var len = 0;

  for (var property in obj)
  {
    var value = obj[property];
    if (typeof value == 'string')
      value = "'" + value + "'";
    else if (typeof value == 'object')
    {
      if (value instanceof Array)
      {
        value = "[ " + value + " ]";
      }
      else
      {
        var ood = DumpObject(value);
        value = "{ " + ood.dump + " }";
      }
    }
    result += "'" + property + "' : " + value + ", ";
    len++;
  }
  od.dump = result.replace(/, $/, "");
  od.len = len;

  return od;
}



