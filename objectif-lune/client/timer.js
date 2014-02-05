var Timer = function() {
	this.lastT = performance.now() / 1000;
	this.dt = 0;

	this.tick = function() {
		var currentT = performance.now() / 1000;
		this.dt = currentT - this.lastT;
		this.lastT = currentT;
	};
};