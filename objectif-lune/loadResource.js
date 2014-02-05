var loadResource = function(path, callback) {
	var request = new XMLHttpRequest();
	request.open('GET', path);
	request.onreadystatechange = function() {
		if (request.readyState === this.DONE) {
			if (request.status === 200) {
				callback(request.responseText);
			}
			else {
				console.log('request for: "' + path + '" failed!');
				console.log(request.responseText);
			}
		}
	};
	request.send();
};