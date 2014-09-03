var loadFile = function(path, callback, errorCallback) {
	var request = new XMLHttpRequest();
	request.open('GET', path);
	request.onreadystatechange = function() {
		if (request.readyState === this.DONE) {
			if (request.status === 200) {
				callback(request.responseText);
			}
			else {
				errorCallback(request.responseText);
			}
		}
	};
	request.send();
};

var loadLicense = function() {
	files = ['LICENSE', 'LICENSE.txt', 'license.txt', 'license.md', 'COPYING', 'COPYING.txt'];
	var i = 0;

	var pre = document.getElementById('license');
	
	(function recurse() {
		loadFile(files[i], function(data) {
			pre.innerText = data;
		}, function() {
			if (i < files.length) {
				i++;
				recurse();
			} else {
				pre.innerText = 'Error: License file not found!';
			}
		});
	})();
}

window.onload = function() {
	loadLicense();
}