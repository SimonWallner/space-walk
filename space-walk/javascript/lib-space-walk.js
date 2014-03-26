var LibSpaceWalk = function() {
	var that = this;

	/*
	 * message callback that is called with the incoming message as an already
	 * parse object.
	 */
	this.onMessage = function(object) {};

	/*
	 * Called after the 'load' message was received from the space walk client
	 */
	this.onPluginLoaded = function() {};

	/*
	 * Called whenever a new session was started. 
	 */
	this.onSessionStarted = function() {};

	this.postMessage = function(message) {
		var messageString;
		if (typeof(message) === 'string') {
			messageString = message;
		} else {
			messageString = JSON.stringify(message)
		}

		window.parent.postMessage(messageString, '*');
	}

	var pluginId = null

	// init
	window.addEventListener('message', function (message) {
		// console.log(message);
		var data = JSON.parse(message.data);

		if (data.type === 'load') {
			pluginId = data.id;

			data.styleSheets.reverse().forEach(function(element) {
				var link = document.createElement('link');
				link.href = element;
				link.type = 'text/css';
				link.rel = 'stylesheet';

				document.head.insertBefore(link, document.head.firstChild);
			});
			that.onPluginLoaded();
		}
		else if (data.type === 'sessionStarted') {
			that.onSessionStarted();
		}
		else if (data.type === 'data') {
			that.onMessage(data.data);
		}
	});

	var resize =  function() {
		var height = document.body.scrollHeight;

	    // Backwards – send message to parent
	    window.parent.postMessage(JSON.stringify({type: 'height', id: pluginId, height: height}), '*');
	}

	window.setInterval(resize, 500);
}


