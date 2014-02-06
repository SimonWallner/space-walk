var autoConnect = true;
var ws = null;
var path = null;
var trailPath = null;

var data = [];
data.push([]);
currentData = data[0];
var dataCount = 0;
var maxElements = 500;
var latestData = [];
var currentLevel = 0;

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
	if (position.z > bounds.top) {
		bounds.top = position.z;
	}
	if (position.z < bounds.bottom) {
		bounds.bottom = position.z;
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
		
		data[0].push(sample);
		latestData.push(sample);

		if ((latestData.length - 2) > dataCount % Math.pow(2, currentLevel)) {
			var last = latestData[latestData.length - 1];
			latestData.length = 0;
			latestData.push(last);
			latestData.push(sample);
		}

		for (var i = 1; i < data.length; i++) {
			if (dataCount % (Math.pow(2, i)) === 0) {
				data[i].push(sample);
			}
		}

		if (data[data.length-1].length > maxElements) {
			currentLevel++;
			data.push([]);
			for (var i = 0; i < data[data.length-2].length; i += 2) {
				data[data.length-1].push(data[data.length-2][i]);
			}
			currentData = data[data.length-1];
			path.datum(currentData);
		}
		
		dataCount++;

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

 var drawPath = function(selection) {
	selection
		.attr('vector-effect', 'inherit')
		.attr('d', d3.svg.line()
			.x(function(d) {return d.position.x})
			.y(function(d) {return d.position.z})
			.interpolate('linear'));
}

var update = function() {

	if (!path) {
		path = group.append('path')
		.datum(currentData)
		.call(drawPath);
	}

	if (!trailPath) {
		trailPath = group.append('path')
		.datum(latestData)
		.call(drawPath);
	}

	path.call(drawPath);
	trailPath.call(drawPath);

	youAreHere.attr('cx', current.position.x)
		.attr('cy', current.position.z);

	updateGroup(bounds);
}

var updateGroup = function(bounds) {
	var scale = Math.min(svg.width / bounds.width(), svg.height / bounds.height()) * 0.9;
	
	group
		// .transition()
		.attr('transform', 'translate(' + (-bounds.centerX() * scale + svg.width / 2) + ' '+
			(-bounds.centerY() * scale + svg.height / 2) + ') scale(' + scale + ')');
}

var makeGrid = function(bounds) {

	var size = 3;
	var logStep = Math.pow(size, Math.floor(Math.log(Math.max(bounds.width(), bounds.height())) / Math.log(size)));
	// console.log(logStep);

	var count = Math.ceil(bounds.width() / logStep);
	// console.log(count);

	var anchorV = Math.floor((bounds.left - (bounds.width())) / logStep) * logStep;

	var dataV = [];
	for (var i = 0; i < count * 10; i++) {
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

	document.getElementById('requestMapTile').onclick = function() {
		requestMapTile({x: 0, y: 0, width: 100, height: 100});
	}

	window.setInterval(function() {
		if (autoConnect && state === connectionState.notConnected) {
			connect();
		}
	}, 500);
}

var requestMapTile = function(rect) {
	ws.send(JSON.stringify({
		type: 'mapTileReuest',
		payload: rect
	}));
}

var receivedMapTile = function(data) {

}
