var data = [];
var svg;

var connectionState = {
	notConnected: "not connected",
	connecting: "connecting",
	connected: "connected"
};

var state = connectionState.notConnected;

var connect = function() {
	state = connectionState.connecting;
	document.getElementById('status').innerHTML = 'connecting';

	url = "ws://localhost:60600";
	
	if ("WebSocket" in window) {
		ws = new WebSocket(url);
	} else if ("MozWebSocket" in window) {
		ws = new MozWebSocket(url);
	} else {
		alert('This Browser does not support WebSockets');
		autoConnect = false;
		return;
	}

	ws.onopen = function(e)
	{
		state = connectionState.connected;
		document.getElementById('status').innerHTML = 'cconnected';
	};

	ws.onmessage = function(message) {
		data.push(JSON.parse(message.data));
		update();
	};

	ws.onerror = function(event) {
		// console.log(event);
		state = connectionState.notConnected;
		document.getElementById('status').innerHTML = 'disconnected';
	};
}

var update = function() {
	svg.selectAll('circle').data(data)
		.enter()
			.append('circle')
				.attr('cx', function(d) {return d.position.x * 100;})
				.attr('cy', function(d) {return d.position.y * 100;})
				.attr('r', 5);
}

window.onload = function() {

	svg = d3.selectAll('#map');

	window.setInterval(function() {
		if (state === connectionState.notConnected) {
			connect();
		}
	}, 1000);
}
