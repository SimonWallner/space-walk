// stuff
var removeFromArray = function(array, element) {
	var index = array.indexOf(element);

	if (index > -1) {
		array.splice(index, 1);
	}
}


var userSettings = null;
var ws = null;

var rxStatus = false;
var iframes = [];

var pluginIndex = 0;

var plugins = [
	{
		name: 'Mapper',
		url: 'plugins/mapper/mapper.html'
	},
	{
		name: 'Debugger',
		url: 'plugins/debug/debug.html'
	}
];

var sessionTimeout = 3000; // ms
var lastTimeStamp
var sessionActive = false;

var connectionState = {
	notConnected: "not connected",
	connecting: "connecting",
	connected: "connected"
};

var state = connectionState.notConnected;

var broadcast = function(data) {
	iframes.forEach(function(iframe) {
		iframe.contentWindow.postMessage(JSON.stringify(data), '*');
	});
}

var connect = function() {
	state = connectionState.connecting;
	$('#connection_status').attr('class', 'connecting padded');
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
		$('#connection_status').attr('class', 'online padded');
		$('#connection_status').text('online');
	};

	var rxHandle = $('#rx');
	ws.onmessage = function(message) {
		if (sessionActive === false) {
			broadcast({type: 'sessionStarted'});
		}
		sessionActive = true;
		lastTimeStamp = new Date().getTime();

		var parsedData = JSON.parse(message.data);
		broadcast({type: 'data', data: parsedData});

		rxStatus = !rxStatus;
		rxHandle.toggleClass('on', rxStatus);
	};

	ws.onerror = function(event) {
		// console.log('connection error');
		// console.log(event);
		state = connectionState.notConnected;
		$('#connection_status').attr('class', 'offline padded');
		$('#connection_status').text('offline');
	};

	ws.onclose = function(event) {
		// console.log(event);
		state = connectionState.notConnected;
		$('#connection_status').attr('class', 'offline padded');
		$('#connection_status').text ('offline');
	};
}

var disconnect = function() {
	ws.close();
	state = connectionState.notConnected;
	$('#connection_status').attr('class', 'offline padded');
	$('#connection_status').text ('offline');
}

var loadPlugin = function(plugin) {

	// console.log('loading plugin:')
	// console.log(plugin);

	id = 'plugin_' + pluginIndex;

	var iframe = $(document.createElement('iframe'))
		.attr('src', plugin.url)
		.attr('seamless', '')
		// .attr('sandbox', 'allow-scripts allow-same-origin')
		.attr('id', id)[0];

	$('#container').append(iframe);
	
	(function(id, plugin, pluginIndex) {
		$('#' + id).load(function() {
			var message = {
				type: 'load',
				id: id,
				styleSheets: $('.base_css').toArray().map(function(element) {
					return element.href;
				})
			}
			$('#' + id)[0].contentWindow.postMessage(JSON.stringify(message), '*');
			// console.log('on iframe load: ' + JSON.stringify(message));

			var item = $(document.createElement('li'))
				.text(plugin.name)
				.attr('class', 'itemize')
			$('#plugins').append(item);

			var deleteLink = $(document.createElement('a'))
				.text(' remove')
				.attr('href', '#')
				.click(function() {
					$('#' + id).remove();
					iframes.splice(pluginIndex, 1);

					$(item).remove();
					removeFromArray(userSettings.plugins, plugin);
					window.localStorage['userSettings'] = JSON.stringify(userSettings)
					
				})
			item.append(deleteLink);
		});
	})(id, plugin, pluginIndex);

	iframes[pluginIndex] = iframe;
	pluginIndex += 1;
}

window.onload = function() {

	console.log('------- onload --------');

	// user settings
	if (window.localStorage['userSettings']) {
		userSettings = JSON.parse(window.localStorage['userSettings']);
	}
	else {
		userSettings =  {};	
	}
	
	userSettings.autoConnect = userSettings.autoConnect || true;
	userSettings.plugins = userSettings.plugins || [];
	userSettings.server = userSettings.server || 'ws://localhost:60600';

	if (userSettings.server) {
		$('#server').val(userSettings.server);
		$('#server_name').text(userSettings.server);
	}

	$('#set_server').click(function() {
		userSettings.server = $('#server').val();
		window.localStorage['userSettings'] = JSON.stringify(userSettings)
		$('#server_name').text(userSettings.server);
		disconnect();
	})

	userSettings.plugins.forEach(function(plugin) {
		loadPlugin(plugin);
	});


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

	$('#load_external_plugin').click(function() {
		var url = $('#external_plugin').val();
		var plugin = {
			name: url,
			url: url
		}

		loadPlugin(plugin);

		userSettings.plugins.push(plugin);
		window.localStorage['userSettings'] = JSON.stringify(userSettings);
	})

	$('#show_settings').click(function() {
		$('#settings').toggleClass('hidden');
	})

	window.setInterval(function() { // auto connect
		if (userSettings.autoConnect && state === connectionState.notConnected) {
			connect();
		}
	}, 500);

	window.setInterval(function() { // rx flipper
		$('#rx').removeClass('on');
	}, 666)

	window.setInterval(function() { // sesison timeout
		if ((new Date().getTime()) > (lastTimeStamp + sessionTimeout)) {
			sessionActive = false;
		}
	}, 500)

	// load plugins
	plugins.forEach(function(element, index) {
		var option = $(document.createElement('option'))
			.attr('value', index)
			.text(element.name);

		$('#build_in_plugins').append(option);
	})
	$('#build_in_plugins').change(function(e) {
		var index = $('#build_in_plugins option:selected').val();
		if (index !== '-1') {
			loadPlugin(plugins[index]);

			userSettings.plugins.push(plugins[index]);
			window.localStorage['userSettings'] = JSON.stringify(userSettings);
		}
	});

	window.addEventListener('message', function (e) {
		// console.log('post message got: ' + e.data);
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
