var data = [];
var current = null;
var last = null;
var svg;
var rxStatus = false;
var rx = null;
var counter = null;

var group = null;
var youAreHere = null;
var grid = null;
var gridH = null;
var gridV = null;

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
		makeGrid(bounds);

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

		youAreHere.attr('cx', current.position.x)
			.attr('cy', current.position.y);
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
	var scale = Math.min(svg.width / bounds.width(), svg.height / bounds.height());
	
	group.transition()
		.attr('transform', 'translate(' + (-bounds.centerX() * scale + svg.width / 2) + ' '+
			(-bounds.centerY() * scale + svg.height / 2) + ') scale(' + scale + ')');
}

var makeGrid = function(bounds) {

	var size = 4;
	var logStep = Math.pow(size, Math.floor(Math.log(Math.min(bounds.width(), bounds.height())) / Math.log(size)));
	// console.log(logStep);

	var count = Math.ceil(bounds.width() / logStep);
	// console.log(count);

	var anchorV = Math.floor((bounds.left - (bounds.width())) / logStep) * logStep;

	var dataV = [];
	for (var i = 0; i < count * 4; i++) {
		dataV.push(anchorV + logStep * i);
	}

	var foo = gridV.selectAll('line').data(dataV);
	foo
		.attr('x1', function(d) {return d;})
		.attr('x2', function(d) {return d;})
		.attr('y1', bounds.bottom - bounds.height())
		.attr('y2', bounds.top + bounds.height())
		.attr('vector-effect', 'inherit')

	foo.enter()
		.append('line')
			.attr('x1', function(d) {return d;})
			.attr('x2', function(d) {return d;})
			.attr('y1', bounds.bottom - bounds.height())
			.attr('y2', bounds.top + bounds.height())
			.attr('vector-effect', 'inherit');
	foo.exit()
		.remove();

	var anchorH = Math.floor((bounds.bottom - (bounds.height())) / logStep) * logStep;

	var dataH = [];
	for (var i = 0; i < count * 4; i++) {
		dataH.push(anchorH + logStep * i);
	}

	foo = gridH.selectAll('line').data(dataH);
	foo
		.attr('x1', bounds.left - bounds.width())
		.attr('x2', bounds.right + bounds.width())
		.attr('y1', function(d) {return d;})
		.attr('y2', function(d) {return d;})
		.attr('vector-effect', 'inherit')

	foo.enter()
		.append('line')
	.attr('x1', bounds.left - bounds.width())
		.attr('x2', bounds.right + bounds.width())
		.attr('y1', function(d) {return d;})
		.attr('y2', function(d) {return d;})
		.attr('vector-effect', 'inherit')
	foo.exit()
		.remove();
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


	youAreHere = group.append('circle')
		.attr('cx', '0')
		.attr('cy', '0')
		.attr('r', '4');

	grid = group.append('g').attr('id', 'grid');
	gridV = grid.append('g').attr('vector-effect', 'non-scaling-stroke');;
	gridH = grid.append('g').attr('vector-effect', 'non-scaling-stroke');;

	grid.attr('vector-effect', 'non-scaling-stroke');


	window.setInterval(function() {
		if (state === connectionState.notConnected) {
			connect();
		}
	}, 1000);
}
