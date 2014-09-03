#!/usr/bin/env node

var commander = require('commander')
var WebSocketServer = require('websocket').server;
var http = require('http');

commander
	.version('dev snapshot')
	.option('-v, --verbose', 'verbose output')
	.option('-u, --generate-user-input', 'generating user input data')
	.option('-l, --generate-location-data', 'generating location data')
	.option('-s, --generate-scalar-data', 'generating scalar data')
	.option('-t, --generate-time-series-data', 'generating time series data')
	.option('-L, --generate-log-data', 'generating log data')
	.option('-p, --port [port number]', 'the port number to be used')
	.option('-i, --interval [interval in ms]', 'the send interval in ms')
	.parse(process.argv);


var port = commander.port || 60600;
var interval = commander.interval || 1000;

console.log('starting test server...\n');
console.log('verbose mode (-v) ........................... ' + (commander.verbose ? 'yes' : 'no'));
console.log('generate user input (-u) .................... ' + (commander.generateUserInput ? 'yes' : 'no'));
console.log('generate location data (-l) ................. ' + (commander.generateLocationData ? 'yes' : 'no'));
console.log('generate scalar data (-s) ................... ' + (commander.generateScalarData ? 'yes' : 'no'));
console.log('generate time series data (-t) .............. ' + (commander.generateTimeSeriesData ? 'yes' : 'no'));
console.log('generate log data (-L) ...................... ' + (commander.generateLogData ? 'yes' : 'no'));
console.log('Using port (-p) ............................. ' + port);
console.log('Send interval in ms (-i) .................... ' + interval);
console.log();


var connectionPool = [];

var server = http.createServer(function(request, response) {
	console.log((new Date()) + ' Received request for ' + request.url);
	response.writeHead(404);
	response.write('nothing to see here');
	response.end();
});

server.listen(port, function() {
	console.log((new Date()) + ' Server is listening on port ' + port);
});

wsServer = new WebSocketServer({
	httpServer: server,
	autoAcceptConnections: false
});

wsServer.on('request', function(request) {
	var connection = request.accept('', request.origin);
	connectionPool.push(connection);
	console.log('connection added. Pool length: ' + connectionPool.length);
	
	if (commander.verbose) {
		connection.on('message', function(message) {
			if (message.type === 'utf8') {
				console.log('Received Message: ' + message.utf8Data);
				connection.sendUTF(message.utf8Data);
			}
			else if (message.type === 'binary') {
				console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
				connection.sendBytes(message.binaryData);
			}	
		});
	}
});

var broadcast = function(object) {
	for (var i = 0; i < connectionPool.length; ++i) {
		connectionPool[i].sendUTF(JSON.stringify(object));
	}

	if (commander.verbose) {
		console.log('sending: ' + JSON.stringify(object));
	}
}

var ConstrainedRandomWalk = function() {
	var position = 0;
	var speed = 0.1;
	
	this.get = function() {
		position = (position + (Math.random() * 2 - 1) * speed);
		return position;
	}
}

var RandomWalk = function() {
	var lastPosition = {x: 0, y: 0, z: 0};
	
	var direction = new ConstrainedRandomWalk();

	this.getWaypoint = function() {
		var newDir = direction.get();
		lastPosition.x += Math.cos(newDir);
		lastPosition.y += Math.sin(newDir);
		lastPosition.z += Math.sin(newDir + 1.0);
		return lastPosition;
	}
}

var startTime = new Date().getTime();
var getTime = function() {
	return (new Date().getTime() - startTime) / 1000; // convert to s
}

var randomWalk = new RandomWalk();

setInterval(function() {
	if (commander.generateLocationData) {
		var pos = randomWalk.getWaypoint();

		var message = {
				type: 'position',
				payload: {
					time: getTime(),
					x: pos.x,
					y: pos.y,
					z: pos.z
				}
			};
		broadcast(message);
	}

	if (commander.generateScalarData) {

		for (var i = 0; i < 10; i++) {
			var message = {
				type: 'scalar',
				payload: {
					name: 'scalar no ' + i,
					value: 42.314 * Math.sin((getTime) + i)
				}
			};
		
			broadcast(message);
		}
	}

	if (commander.generateTimeSeriesData) {
		for (var i = 0; i < 3; i++) {
			var message = {
				type: 'core.simpleTelemetry.sample',
				payload: {
					name: 'data no ' + i,
					time: getTime(),
					value: Math.sin(getTime() * (i + 1))
				}
			};
		
			broadcast(message);
		}
	}

	if (commander.generateLogData) {
		var levels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
		for (var i = 0; i < levels.length; i++) {
			message = {
				type: 'core.simpleLog.message',
				payload: {
					level: levels[i],
					message: 'log message for ' + levels[i]
				}
			};
			
			broadcast(message);
		}
	}

}, interval);
