var libsw = new LibSpaceWalk();

libsw.onMessage = function(data) {
	$('#dump').append(new Date().toString() + ': message got: ' + JSON.stringify(data) + '<br>');	
}	
