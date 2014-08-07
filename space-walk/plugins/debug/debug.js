var libsw = new LibSpaceWalk();

var Timer = function() {
	var msSpan = document.getElementById('data-ms');
	var fpsSpan = document.getElementById('data-fps');
	var that = this;

	this.lastT = performance.now();
	this.deltaT = 0;

	this.tick = function() {
		var currentT = performance.now();
		this.deltaT = currentT - this.lastT;
		this.lastT = currentT;
	};
	
	this.print = function() {
		msSpan.innerHTML = that.deltaT.toFixed(2);
		fpsSpan.innerHTML = (1 / that.deltaT * 1000).toFixed(2);
	};
};

timer1 = new Timer();
timer2 = new Timer();
timer3 = new Timer();

window.onload = function() {
	window.requestAnimationFrame(function recurse() {
		timer1.tick();
		$('#anim-frame').text(timer1.deltaT.toFixed(2));

		window.requestAnimationFrame(recurse);
	})

	window.setInterval(function() {
		timer2.tick();
		$('#interval').text(timer2.deltaT.toFixed(2));	
	}, 0)
}


libsw.onMessage = function(data) {
	// $('#dump').append(new Date().toString() + ': message got: ' + JSON.stringify(data) + '<br>');	
	// $('#dump').text(new Date().toString() + ': message got: ' + JSON.stringify(data));

	timer3.tick();
	$('#message').text(timer3.deltaT.toFixed(2));
}	
