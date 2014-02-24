#! /usr/bin/env node

var http = require('http')
var director = require('director');
var fs = require('fs');
var path = require('path');
var mustache = require('mustache');

// transformers
var positionData = require('./transformers/positionData.js');

var documentRoot = process.cwd();

 // monkey patching
 String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

var notFound = function(response, file) {
	  response.writeHead(404);
      response.end('404 not found: ' + file);
}

var staticFile = function(file, response) {

	response = response || this.res;

	var index = file.indexOf('?');
	if (index >= 0) {
		file = file.substring(0, index);
	}

	// console.log('trying to retrieve file: ' + file)

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

function serveData(directory, transformer) {
	return function(resource) {
		var fullPath = path.join(documentRoot, 'data', directory, resource);

		var response = this.res;

		fs.readFile(fullPath, function(err, data) {
			if (err) {
				console.log('resource not found: ' + fullPath);
				notFound(response, fullPath);
			}
			else {
				var transformed = transformer.transform(data);

				response.writeHead(200, { 'Content-Type': transformer.mime });
				response.end(transformed);
			}
		})
	}

	this.res.writeHead(200, { 'Content-Type': 'text/plain' })
	this.res.end('session: ' + session);
}

function index() {
	// director relies on this keyword
	staticFile.bind(this, 'index.html')();

	// what to serve...
	// - intro and help, how to use it
	// - list of available services
}

var listResources = function() {
	var fullPath = path.join(documentRoot, 'data/', this.req.url);

	var response = this.res;

	fs.readdir(fullPath, function(err, files) {
		if (err) {
			response.writeHead(500);
      		response.end('500 failed to list Resources');
      		console.log('reading directory failed: ' + path + ' err: ' + err);
		} else {
			var locals = {resources: []};
			files.map(function(element) {
				locals.resources.push({name: element});
			});

			renderTemplate(response, 'listPositions.stache', locals)
		}
	});
}

var renderTemplate = function(response, name, locals) {
	console.log('trying to render template: ' + name + ' with vars: ' + JSON.stringify(locals));

	var fullPath = path.join(documentRoot, 'templates/', name);
	fs.readFile(fullPath, function(err, file) {
		if (err) {
			console.log('template not found: ' + name)
			response.writeHead(500);
      		response.end('500 template not found');
		} else {
			response.writeHead(200, { 'Content-Type': 'text/html' });
			response.end(mustache.render(String(file), locals));
		}
	});
}

// routing table
var router = new director.http.Router({
	'/': { get: index },
	'/positions': {get: listResources },
	'/positions/:session': { get: serveData('/positions', positionData) },
});

//
// setup a server and when there is a request, dispatch the
// route that was requested in the request object.
//
var server = http.createServer(function (req, response) {
	router.dispatch(req, response, function (err) {
		if (err) {
			// TODO find out how to do propper static routes and stop abusing 
			// the error function here.
			var url = req.url;
			staticFile(url, response)
		}
	});
});


//
// set the server to listen on port `8080`.
//
server.listen(8080);
console.log('starting server on: 8080');