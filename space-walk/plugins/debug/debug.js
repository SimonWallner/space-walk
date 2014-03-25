var pluginId = null;

window.addEventListener('message', function (message) {
	var data = JSON.parse(message.data);
	$('#dump').append(new Date().toString() + ': message got: ' + message.data + '<br>');	

	if (data.type === 'load') {
		pluginId = data.id;
	}
	// else if (data.type === 'data')
	// {
	// 	$('#dump').append(new Date().toString() + ': ' + JSON.stringify(data.data) + '<br>');
	// }
	// else {
	// 	$('#dump').append(new Date().toString() + ': unknown message got: ' + message + '<br>');	
	// }
	
});


window.onload = function() {
	var resize = function() {
		var height = $(document).height();
		
	    // Backwards – send message to parent
	    window.parent.postMessage(JSON.stringify({type: 'height', id: pluginId, height: height}), '*');
	}

	window.setInterval(resize, 500);
};