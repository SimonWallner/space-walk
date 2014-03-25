var userSettings = {};
var ws = null;

var rxStatus = false;
var iframes = [];

var plugins = [
	{
		name: 'Mapper',
		url: 'plugins/mapper/mapper.html'
	},
	{
		name: 'Debugger',
		url: 'plugins/debug/debug.html'
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
		iframes.forEach(function(iframe) {
			data = JSON.parse(message.data);
			iframe.contentWindow.postMessage(JSON.stringify({type: 'data', data: data}), '*');
		})

		rxStatus = !rxStatus;
		$('#rx').toggleClass('on', rxStatus);
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

var loadPlugin = function(plugin, id) {
	var iframe = $(document.createElement('iframe'))
		.attr('src', plugin.url)
		.attr('seamless', '')
		.attr('sandbox', 'allow-scripts allow-same-origin')
		.attr('id', id)[0];

	$('#container').append(iframe);


	
	$('#' + id).load(function() {
		var message = {
			type: 'load',
			id: id,
			styleSheets: $('.base_css').toArray().map(function(element) {
				return element.href;
			})
		}
		$('#' + id)[0].contentWindow.postMessage(JSON.stringify(message), '*');
	});

	iframes.push(iframe);
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

	window.setInterval(function() {
		$('#rx').removeClass('on');
	}, 666)

	// load plugins
	loadPlugin(plugins[1], 'plugin_0');
	loadPlugin(plugins[0], 'plugin_1');
	window.addEventListener('message', function (e) {
	    var message = JSON.parse(e.data);
	    
		switch (message.type) {
			case 'height':
				$('#' + message.id).height(message.height);
				break;
			case 'message':
				ws.send(JSON.stringify(message.payload));
				break;
			default:
				console.log('unknown post message received');
				console.log(e);
				break;

	    }
	});

	console.log('------- /onload --------');
}
