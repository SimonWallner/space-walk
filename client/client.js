var data = [];
var current = null;
var last = null;
var svg;
var rxStatus = false;
var rx = null;
var counter = null;

var group = null;

var bounds = {
	top: -Number.MAX_VALUE,
	left: Number.MAX_VALUE,
	bottom: Number.MAX_VALUE,
	right: -Number.MAX_VALUE,

	width: function() {
		return this.right - this.left;
	},

	height: function() {
		return this.top - this.bottom;
	},

	centerX: function() {
		return (this.right + this.left) / 2;
	},

	centerY: function() {
		return (this.top + this.bottom) / 2;
	}
}

var updateBounds = function(position, bounds) {
	if (position.x > bounds.right) {
		bounds.right = position.x;
	}
	if (position.x < bounds.left) {
		bounds.left = position.x;
	}
	if (position.y > bounds.top) {
		bounds.top = position.y;
	}
	if (position.y < bounds.bottom) {
		bounds.bottom = position.y;
	}
}

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
		var sample = JSON.parse(message.data);
		data.push(sample);

		updateBounds(sample.position, bounds);

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
	if (last) {
		group
			.append('line')
				.attr('x1', last.position.x)
				.attr('x2', current.position.x)
				.attr('y1', last.position.y)
				.attr('y2', current.position.y)
				.attr('vector-effect', 'inherit');	
	}

	updateGroup(bounds);
	// svg.selectAll('line').data(data)
	// 	.enter()
	// 		.append('line')
	// 			.attr('x1', function(d) {return d.position.x * 200})
	// 			.attr('x2', function(d, i) {return data[i-1] && data[i-1].position.x* 200})
	// 			.attr('y1', function(d) {return d.position.y* 200})
	// 			.attr('y2', function(d, i) {return data[i-1] && data[i-1].position.y* 200});	

}

var updateGroup = function(bounds) {
	group.attr('transform', 'translate(' + (-bounds.centerX() * 0.1 + svg.width / 2) + ' '+
		(-bounds.centerY() * 0.1 + svg.height / 2) + ') scale(0.1)');
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

	svg = d3.select('#map');
	svg.width = svg[0][0].clientWidth;
	svg.height = svg[0][0].clientHeight;

	group = svg.append('g');
	group.attr('vector-effect', 'non-scaling-stroke');


	// group.append('circle')
	// 	.attr('cx', '0')
	// 	.attr('cy', '0')
	// 	.attr('r', '10');
	// group.attr('transform', 'translate(100 10)');

	window.setInterval(function() {
		if (state === connectionState.notConnected) {
			connect();
		}
	}, 1000);
}
