var autoConnect = true;
var ws = null;

var connectionState = {
	notConnected: "not connected",
	connecting: "connecting",
	connected: "connected"
};

var state = connectionState.notConnected;

var connect = function() {
	state = connectionState.connecting;
	document.getElementById('connect').className = 'connecting';

	url = window.localStorage['server'];
	
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
		document.getElementById('connect').innerHTML = 'connected';
	};

	ws.onmessage = function(message) {
		var sample = JSON.parse(message.data);
		
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
		}
	};

	ws.onerror = function(event) {
		// console.log(event);
		state = connectionState.notConnected;
		document.getElementById('connect').className = 'offline';
		document.getElementById('connect').innerHTML = 'disconnected';
	};

	ws.onclose = function(event) {
		// console.log(event);
		state = connectionState.notConnected;
		document.getElementById('connect').className = 'offline';
		document.getElementById('connect').innerHTML = 'disconnected';
	};
}

var close = function() {
	ws.close();
	state = connectionState.notConnected;
}

window.onload = function() {

	console.log('------- onload --------');

	$('#set_server').click(function() {
		window.localStorage['server'] = $('#server').val();
		$('#server_name').text($('#server').val());
	})

	if (window.localStorage['server']) {
		$('#server').val(window.localStorage['server']);
		$('#server_name').text(window.localStorage['server']);
		console.log(document.getElementById('server').value);
	}

	window.setInterval(function() {
		if (autoConnect && state === connectionState.notConnected) {
			connect();
		}
	}, 500);

	console.log('------- /onload --------');
}
