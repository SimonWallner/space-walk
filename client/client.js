var data = [];
var current = null;
var last = null;
var svg;
var rxStatus = false;
var rx = null;
var counter = null;

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
		last = current;
		current = JSON.parse(message.data);

		update();

		rxStatus = !rxStatus;
		if (rxStatus) {
			rx.attr('class', 'off');
		} else {
			rx.attr('class', 'on');
		}
		counter.hit();
		counter.print();
	};

	ws.onerror = function(event) {
		// console.log(event);
		state = connectionState.notConnected;
		document.getElementById('status').innerHTML = 'disconnected';
	};
}

var update = function() {
	// if (last) {
	// 	svg
	// 		.append('line')
	// 			.attr('x1', last.position.x * 200)
	// 			.attr('x2', current.position.x * 200)
	// 			.attr('y1', last.position.y * 200)
	// 			.attr('y2', current.position.y * 200);	
	// }
	svg.selectAll('line').data(data)
		.enter()
			.append('line')
				.attr('x1', function(d) {return d.position.x * 200})
				.attr('x2', function(d, i) {return data[i-1] && data[i-1].position.x* 200})
				.attr('y1', function(d) {return d.position.y* 200})
				.attr('y2', function(d, i) {return data[i-1] && data[i-1].position.y* 200});	

}

window.onload = function() {

	var Counter = function() {
		var count = 0;
		var start = performance.now();

		var totalSpan = document.getElementById('total');
		var rateSpan = document.getElementById('rate');

		this.print = function() {
			totalSpan.innerHTML = count;
			rateSpan.innerHTML = (count / ((performance.now() - start) / 1000)).toFixed(3);
		}

		this.hit = function() {
			count++;
		}
	}

	counter = new Counter();

	rx = d3.select('#rx');
	rx.attr('class', 'off');

	svg = d3.selectAll('#map');

	window.setInterval(function() {
		if (state === connectionState.notConnected) {
			connect();
		}
	}, 1000);
}
