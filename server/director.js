#! /usr/bin/env node

var http = require('http')
var director = require('director');
var fs = require('fs');
var path = require("path");

var documentRoot = process.cwd();

 // monkey patching
 String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

var notFound = function(response, file) {
	  response.writeHead(404);
      response.end('404 not found: ' + file);
}

var serveFile = function(file) {
	var mime;
	if (file.endsWith('html')) {
		mime = 'text/html';
	} else if (file.endsWith('css')) {
		mime = 'text/css';
	} else if (file.endsWith('jpg')) {
		mime = 'img/jpg';
	} else if (file.endsWith('png')) {
		mime = 'img/png';
	} else if (file.endsWith('svg')) {
		mime = 'image/svg';
	} else {
		mime = 'text/plain';
	}
	
	var fullPath = path.join(documentRoot, 'static/', file);

	var response = this.res;

	fs.readFile(fullPath, function(err, data) {
		if (err) {
			console.log('resource not found: ' + fullPath);
			notFound(response, file);
		}
		else {
			console.log('serving static: ' + fullPath);
			response.writeHead(200, { 'Content-Type': mime });
			response.end(data);
		}
	});
}

function servePositions(session) {
	this.res.writeHead(200, { 'Content-Type': 'text/plain' })
	this.res.end('session: ' + session);
}

function index() {
	// director relies on this keyword
	serveFile.bind(this, 'index.html')();
}

// routing table
var router = new director.http.Router({
	'/': {get: index},
	'/:file': {get: serveFile},
	'/positions/:session': {get: servePositions}
});

//
// setup a server and when there is a request, dispatch the
// route that was requested in the request object.
//
var server = http.createServer(function (req, res) {
	router.dispatch(req, res, function (err) {
		if (err) {
			notFound(res, err);
		}
	});
});


//
// set the server to listen on port `8080`.
//
server.listen(8080);