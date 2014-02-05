var ws;
var url;
var connectionState = {
	notConnected: "not connected",
	connecting: "connecting",
	connected: "connected"
};

var autoConnect = true;

// ==== Logging Data ====
var logData = [];
var filteredData = [];


// === variable tweaking ===
var floatVariables = [];


// ==== session stuff ====
var sessionID = 0;


function nextShowState(state) {
	if (state === showState.show)
		return showState.faded;
	else if (state == showState.faded)
		return showState.hide;
	else
		return showState.show;
}

var state = connectionState.notConnected;

var x = d3.scale.linear()
	.domain([0, 100])
	.range([0, 600])
	
var y = d3.scale.linear()
	.domain([0, 10])
	.range([140, 0])


function connect() {
	url = document.getElementById("server_url").value;
	
	if ("WebSocket" in window) {
		ws = new WebSocket(url);
	} else if ("MozWebSocket" in window) {
		ws = new MozWebSocket(url);
	} else {
		alert('This Browser does not support WebSockets');
		autoConnect = false;
		return;
	}

	state = connectionState.connecting;

	ws.onopen = function(e) {
		notice("connection to " + ws.URL + " established!");
		
		document.getElementById("server_url").disabled = true;
		state = connectionState.connected;
		d3.select('#connectionStatus')
			.text('connected')
			.attr('class', 'connected')
	};
	
	ws.onerror = function(e) {
		console.log(e);
		state = connectionState.notConnected;
		d3.select('#connectionStatus')
			.text('disconnected')
			.attr('class', 'disconnected')
	};
	
	ws.onclose = function(e) {
		if (state === connectionState.connected) {
			warn("connection to " + ws.URL + " closed!");
		}
		state = connectionState.notConnected;
	};
	
	ws.onmessage = function(msg) {
		var cleanMessage = msg.data.replace(/\n/g, '<br>');
		cleanMessage = cleanMessage.replace(/\t/g, '&emsp;&emsp;');
		cleanMessage = cleanMessage.replace(/\\/g, '\\\\');
		var data = JSON.parse(cleanMessage);
		
		if (data.type === 'screenshot') {
			// do magic
		}
	};
}

function notification(CSSClass, msg) {
	d3.select('#notice-area').append('div')
		.attr('class', CSSClass)
		.text(msg)
		.style('opacity', 1)
		.transition()
			.duration(5000)
				.style('opacity', 0)
				.remove();
}

function notice(msg) {
	notification('notice', msg);
}

function warn(msg) {
	notification('warning', msg);
}


function disconnect() {
	ws.close();
	document.getElementById("server_url").disabled = false;
	d3.select('#connectionStatus')
		.text('disconnected')
		.attr('class', 'disconnected')
}


function auto_connect() {
	if (autoConnect === true) {
		if (state === connectionState.notConnected) {
			d3.select('#connectionStatus')
				.attr('class', 'connecting')
				.text('connecting...')
			connect();
		}
	}
}


function init() {	
	
	$('#autoConnect').click(function() {
		autoConnect = true;
		d3.select('#autoConnect')
			.attr('class', 'active')
		d3.select('#disconnect')
			.attr('class', '')
	})
	
	$('#disconnect').click(function() {
		autoConnect = false;
		disconnect();
		d3.select('#disconnect')
			.attr('class', 'active')
		d3.select('#autoConnect')
			.attr('class', '')
	})
	
	// connect when ready	
	setInterval(auto_connect, 500);
	
	$('#get-screenshot').click(function() {
		var response = { type: "getScreenshot" }
		ws.send(JSON.stringify(response))
	});
}


var readyStateCheckInterval = setInterval(function() {
	   if (document.readyState === "complete") {
		   init();
		   clearInterval(readyStateCheckInterval);
	   }
}, 10);