var userSettings = {};
var ws = null;

var plugins = [
	{
		name: 'Mapper',
		url: 'plugins/mapper/mapper.html'
	}
]


var connectionState = {
	notConnected: "not connected",
	connecting: "connecting",
	connected: "connected"
};

var state = connectionState.notConnected;

var connect = function() {
	state = connectionState.connecting;
	$('#connection_status').attr('class', 'connecting');
	$('#connection_status').text('connecting');
	
	if ("WebSocket" in window) {
		ws = new WebSocket(userSettings.server);
	} else if ("MozWebSocket" in window) {
		ws = new MozWebSocket(userSettings.server);
	} else {
		alert('This Browser does not support WebSockets');
		autoConnect = false;
		return;
	}

	ws.onopen = function(e)
	{
		state = connectionState.connected;
		$('#connection_status').attr('class', 'online');
		$('#connection_status').text('online');
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
		$('#connection_status').attr('class', 'offline');
		$('#connection_status').text('offline');
	};

	ws.onclose = function(event) {
		// console.log(event);
		state = connectionState.notConnected;
		$('#connection_status').attr('class', 'offline');
		$('#connection_status').text ('offline');
	};
}

var disconnect = function() {
	ws.close();
	state = connectionState.notConnected;
	$('#connection_status').attr('class', 'offline');
	$('#connection_status').text ('offline');
}

var loadPlugin = function(plugin) {
	var iframe = $(document.createElement('iframe'))
		.attr('src', plugin.url)
		.attr('seamless', '')
		.attr('sandbox', 'allow-scripts allow-same-origin')
		.attr('id', 'plugin_1');

	$('#container').append(iframe);
	$('#plugin_1').load(function() {
		$('#plugin_1')[0].contentWindow.postMessage(JSON.stringify({type: 'load', id: 'plugin_1'}), '*');
	});
}

window.onload = function() {

	console.log('------- onload --------');

	$('#set_server').click(function() {
		userSettings.server = $('#server').val();
		window.localStorage['server'] = userSettings.server;
		$('#server_name').text(userSettings.server);
		disconnect();
	})

	if (window.localStorage['server']) {
		userSettings.server = window.localStorage['server']
		$('#server').val(userSettings.server);
		$('#server_name').text(userSettings.server);
	}

	userSettings.autoConnect = window.localStorage['server'] || true;

	$('#disconnect').click(function() {
		userSettings.autoConnect = false;
		disconnect();
	})

	$('#dump_settings').click(function() {
		alert('user settings: \n' + JSON.stringify(userSettings));
	})

	$('#load_settings').click(function() {
		alert('not implemented yet :(')
	})

	window.setInterval(function() {
		if (userSettings.autoConnect && state === connectionState.notConnected) {
			connect();
		}
	}, 500);

	// load plugins
	loadPlugin(plugins[0]);
	window.addEventListener('message', function (e) {
	    var message = JSON.parse(e.data);

	    switch (message.type) {
	        case 'height':
	            $('#' + message.id).height(message.height);
	            break;
	    }
	});

	console.log('------- /onload --------');
}
