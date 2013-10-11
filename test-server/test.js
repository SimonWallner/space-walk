var connectionState = {
	notConnected: "not connected",
	connecting: "connecting",
	connected: "connected"
};

var state = connectionState.notConnected;

var connect = function() {
	url = "ws://localhost:60600";
	
	if ("WebSocket" in window)
	{
		ws = new WebSocket(url);
	}
	else if ("MozWebSocket" in window)
	{
		ws = new MozWebSocket(url);
	}
	else
	{
		alert('This Browser does not support WebSockets');
		autoConnect = false;
		return;
	}

	state = connectionState.connecting;
	document.getElementById('status').innerHTML = 'connecting'

	ws.onopen = function(e)
	{
		state = connectionState.connected;
	};
}

window.onload = function() {
	window.setTimeout(function() {
		if (state === connectionState.notConnected) {
			connect();
		}
	}, 1000);

	window.setTimeout(function() {
		if (state === connectionState.connected) {
			ws.send(JSON.stringify({
				time: performance.now(),
				position: {
					x: Math.sin(performance.now() / 1000),
					y: Math.cos(performance.now() / 1000)
				}
			}))
		}
	})
}
