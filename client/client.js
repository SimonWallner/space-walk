var autoConnect = true;
var ws = null;

var data = [];
var data2 = [];
var data4 = [];
var data8 = [];
var data16 = [];
var dataCount = 0;
currentData = data;
var maxElements = 1000;

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
	document.getElementById('connect').className = 'connecting';

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
		document.getElementById('connect').className = 'online';
	};

	ws.onmessage = function(message) {
		var sample = JSON.parse(message.data);

		dataCount++;
		data.push(sample);
		if (dataCount % 2 === 0) {
			data2.push(sample);
		}
		if (dataCount % 4 === 0) {
			data2.push(sample);
		}
		if (dataCount % 8 === 0) {
			data2.push(sample);
		}
		if (dataCount % 16 === 0) {
			data2.push(sample);
		}


		// if (currentData.length > maxElements) {
		// 	currentData = data2;
		// }

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
		document.getElementById('connect').className = 'offline';
	};
}

var close = function() {
	ws.close();
	state = connectionState.notConnected;
}

var update = function() {
	// if (data.length > 1) {
	// 	group.selectAll('line').data(data)
	// 		.enter()
	// 			.append('line')
	// 				.attr('x1', function(d) {return d.position.x })
	// 				.attr('x2', function(d, i) {
	// 					return data[i-1].position.x})
	// 				.attr('y1', function(d) {return d.position.y})
	// 				.attr('y2', function(d, i) {return data[i-1].position.y})
	// 				.attr('vector-effect', 'inherit');
	// 	}

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

	var domSVG = document.getElementById('map');

	var mouseDown = false;
	document.onmousemove = function(event) {
		if (mouseDown) {
			// console.log('dragging')
			// console.log(event.clientX);
		}
	}

	domSVG.onmousedown = function() {
		mouseDown = true;
	}

	document.onmouseup = function(event) {
		mouseDown = false;
	}

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

	document.getElementById('connect').onclick = function() {
		autoConnect = !autoConnect;
		document.getElementById('connect').className = 'offline';

		if (state === connectionState.connected) {
			close();
		}
	}

	window.setInterval(function() {
		if (autoConnect && state === connectionState.notConnected) {
			connect();
		}
	}, 500);
}
