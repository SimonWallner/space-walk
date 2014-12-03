var LibSpaceWalk = function() {
	var that = this;

	/*
	 * message callback that is called with the incoming message as an already
	 * parsed object.
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

		if (typeof(message) === 'string') {
			message = JSON.parse(message);
		}

		msgObject = {
			type: 'message',
			payload: message
		}

		window.parent.postMessage(JSON.stringify(msgObject), '*');
	}

	var isPaused = false;
	this.isPaused = function() {
		return isPaused;
	}

	// this id is used for the resizing magic of the iframes
	var pluginId = null

	// init
	window.addEventListener('message', function(message) {
		var data = JSON.parse(message.data);

		if (data.type === 'load') {
			pluginId = data.id;
			that.onPluginLoaded();
		}
		else if (data.type === 'sessionStarted') {
			that.onSessionStarted();
		}
		else if (data.type === 'data') {
			that.onMessage(data.data);
		}
		else if(data.type === 'pause') {
			isPaused = data.value;
		}
	});

	var resize =  function() {
		var height = document.body.scrollHeight;

	    // Backwards – send message to parent
	    window.parent.postMessage(JSON.stringify({type: 'height', id: pluginId, height: height}), '*');
	}

	window.setInterval(resize, 500);
}
