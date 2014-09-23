// based on: http://www.html5rocks.com/en/tutorials/file/dndfiles/

var handleFileSelect = function(evt) {
	evt.stopPropagation();
	evt.preventDefault();

	var files = evt.dataTransfer.files; // FileList object.

	// files is a FileList of File objects. List some properties.
	var output = [];
	for (var i = 0, file; file = files[i]; i++) {

		if (file) {
			var reader = new FileReader();
			reader.readAsArrayBuffer(file);
			reader.onload = function(evt) {
				var arr = new Uint8Array(evt.target.result);
				var join = '0x' + arr[0].toString(16);
				for(var j = 1; j < arr.length; j++) {
					join += ', 0x' + arr[j].toString(16);
					if (j % 16 === 0) {
						join += '<br>';
					}
				}
				document.getElementById("dataSpan").innerHTML = '{' + join + '}';
				document.getElementById("lengthSpan").innerHTML = arr.length;
			}
			reader.onerror = function (evt) {
				document.getElementById("fileContents").innerHTML = "error reading file";
			}
		}


		output.push('<li><strong>', escape(file.name), '</strong> (', file.type || 'n/a', ') - ',
								file.size, ' bytes, last modified: ',
								file.lastModifiedDate ? file.lastModifiedDate.toLocaleDateString() : 'n/a',
								// '<br>',
								// '[', f.getAsBinary().join(', '), ']',
								'</li>');
	}
	document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';
}

var handleDragOver = function(evt) {
	evt.stopPropagation();
	evt.preventDefault();
	evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}

// Setup the dnd listeners.
window.onload = function() {
	var dropZone = document.getElementById('dropZone');
	dropZone.addEventListener('dragover', handleDragOver, false);
	dropZone.addEventListener('drop', handleFileSelect, false);  
}
	