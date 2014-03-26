// patches
window.performance = window.performance || {};
performance.now = (function() {
    return performance.now       ||
        performance.mozNow    ||
        performance.msNow     ||
        performance.oNow      ||
        performance.webkitNow ||            
        Date.now  /*none found - fallback to browser default */
})();

// patches END

var libsw = new LibSpaceWalk();

var path = null;
var trailPath = null;

var ratio = 0;

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
var counter = null;

var group = null;
var youAreHere = null;
var grid = null;
var gridH = null;
var gridV = null;

var mapGroup = null;
var currentTile = {
	x: 0,
	y: 0,
	width: 0,
	height: 0
}
var mapTileRequested = false;

var bounds = {
	xMin: Number.MAX_VALUE,
	xMax: -Number.MAX_VALUE,
	yMin: Number.MAX_VALUE,
	yMax: -Number.MAX_VALUE,

	width: function() {
		return this.xMax - this.xMin;
	},

	height: function() {
		return this.yMax - this.yMin;
	},

	centerX: function() {
		return (this.xMin + this.xMax) / 2.0;
	},

	centerY: function() {
		return (this.yMin + this.yMax) / 2.0;
	}
}

var updateBounds = function(position, bounds) {
	bounds.xMax = Math.max(bounds.xMax, position.x);
	bounds.xMin = Math.min(bounds.xMin, position.x);
	bounds.yMax = Math.max(bounds.yMax, position.z);
	bounds.yMin = Math.min(bounds.yMin, position.z);
	
	if (!mapTileRequested && ((bounds.width() * 2) > currentTile.width ||
			(bounds.height() * 2) > currentTile.height)) {
		// request new tile
		// compute bounds of canvas in world coords
		requestMapTile({
			x: bounds.xMin - ((bounds.width() * 0.5) + 5),
			y: bounds.yMin - ((bounds.height() * 0.5) + 5),
			width: bounds.width() + ((bounds.width() * 1.5) + 10),
			height: bounds.height() + ((bounds.height() * 1.5) + 10)
		});

		// mapTileRequested = true;
	}
}

var mapTile = function(json) {
	console.log(json);

	mapGroup.selectAll('image').remove();
	mapGroup.append('image')
		.attr('x', json.x)
		.attr('y', -(json.y + json.height))
		.attr('width', json.width)
		.attr('height', json.height)
		.attr('xlink:href', 'data:' + json.type + ', ' + json.data);
	
	mapTileRequested = false;
	currentTile = json;

	// debug output
	d3.select('#image img').remove();
	d3.select('#image').append('img')
		.attr('src', 'data:' + json.type + ', ' + json.data);
}

libsw.onMessage = function(message) {
	var sample = message;
	
	if (sample.type === "mapTile") {
		mapTile(sample.payload);
		return;
	} else if (sample.type === "position") {
	
		data[0].push(sample.payload);
		latestData.push(sample.payload);

		if ((latestData.length - 2) > dataCount % Math.pow(2, currentLevel)) {
			var last = latestData[latestData.length - 1];
			latestData.length = 0;
			latestData.push(last);
			latestData.push(sample.payload);
		}

		for (var i = 1; i < data.length; i++) {
			if (dataCount % (Math.pow(2, i)) === 0) {
				data[i].push(sample.payload);
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

		updateBounds(sample.payload, bounds);

		last = current;
		current = sample;

		update();
		makeGrid(bounds);

		counter.hit();
		counter.print();
	}
};

 var drawPath = function(selection) {
	selection
		.attr('vector-effect', 'inherit')
		.attr('d', d3.svg.line()
			.x(function(d) {return d.x})
			.y(function(d) {return -d.z})
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

	youAreHere.attr('cx', current.x)
		.attr('cy', current.z);

	updateGroup(bounds);
}

var updateGroup = function(bounds) {
	var scale = Math.min(svg.width / bounds.width(), svg.height / bounds.height()) * 0.9;
	
	group
		// .transition()
		.attr('transform', 'translate(' + (-bounds.centerX() * scale + svg.width / 2) + ' '+
			(bounds.centerY() * scale + svg.height / 2) + ') scale(' + scale + ')');
}

var makeGrid = function(bounds) {

	var size = 3;
	var logStep = Math.pow(size, Math.floor(Math.log(Math.max(bounds.width(), bounds.height())) / Math.log(size)));
	// console.log(logStep);

	var count = Math.ceil(bounds.width() / logStep);
	// console.log(count);

	var anchorV = Math.floor((bounds.xMin - (bounds.width())) / logStep) * logStep;

	var dataV = [];
	for (var i = 0; i < count * 10; i++) {
		dataV.push(anchorV + logStep * i);
	}

	var foo = gridV.selectAll('line').data(dataV);
	foo
		.attr('x1', function(d) {return d;})
		.attr('x2', function(d) {return d;})
		.attr('y1', bounds.yMin - 10 * bounds.height())
		.attr('y2', bounds.yMax + 10 * bounds.height())
		.attr('vector-effect', 'inherit')

	foo.enter()
		.append('line')
			.attr('x1', function(d) {return d;})
			.attr('x2', function(d) {return d;})
			.attr('y1', bounds.yMin - 10 * bounds.height())
			.attr('y2', bounds.yMax + 10 * bounds.height())
			.attr('vector-effect', 'inherit');
	foo.exit()
		.remove();

	var anchorH = Math.floor((bounds.yMax - (bounds.height())) / logStep) * logStep;

	var dataH = [];
	for (var i = 0; i < count * 4; i++) {
		dataH.push(anchorH + logStep * i);
	}

	foo = gridH.selectAll('line').data(dataH);
	foo
		.attr('x1', bounds.xMin - 10 * bounds.width())
		.attr('x2', bounds.xMax + 10 * bounds.width())
		.attr('y1', function(d) {return d;})
		.attr('y2', function(d) {return d;})
		.attr('vector-effect', 'inherit');

	foo.enter()
		.append('line')
		.attr('x1', bounds.xMin - 10 * bounds.width())
		.attr('x2', bounds.xMax + 10 * bounds.width())
		.attr('y1', function(d) {return d;})
		.attr('y2', function(d) {return d;})
		.attr('vector-effect', 'inherit');

	foo.exit()
		.remove();
}

window.onload = function() {

	console.log('------- onload mapper --------');

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
	ratio = svg.width / svg.height;

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
	mapGroup = group.append('g');


	youAreHere = group.append('circle')
		.attr('cx', '0')
		.attr('cy', '0')
		.attr('r', '4');

	grid = group.append('g').attr('id', 'grid');
	gridV = grid.append('g').attr('vector-effect', 'non-scaling-stroke');;
	gridH = grid.append('g').attr('vector-effect', 'non-scaling-stroke');;

	grid.attr('vector-effect', 'non-scaling-stroke');


	console.log('------- /onload mapper --------');
}

var requestMapTile = function(rect) {
	var message = {
		type: 'message',
		payload: {
			type: 'mapTileRequest',
			payload: rect
		}
	}
	libsw.postMessage(message);
}
