#! /usr/bin/env node
/**
 * known issues
 * 	- spaces in the data file names confuses the router and leads to routing errors
 *	- same goes for brackets
 */

 /**
  * find the routing table at the bottom of this file
  */



var http = require('http')
var director = require('director');
var fs = require('graceful-fs');
var path = require('path');
var mustache = require('mustache');

// transformers
var positionData = require('./transformers/positionData.js');
var sessionSCV = require('./transformers/sessionCSV.js');

var documentRoot = process.cwd();

 // monkey patching
 String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

// taken from http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
               .toString(16)
               .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
         s4() + '-' + s4() + s4() + s4();
}


var buildHeader = function(mime) {
	return {
		'Content-Type': mime,
		'Cache-Control': 'no-cache',
		'Accept-Ranges': 'none'
	}
}

var notFound = function(response, file) {
	  response.writeHead(404);
      response.end('404 not found: ' + file);
}

var staticFile = function(file, request, response) {

	// removing url parameters
	var index = file.indexOf('?');
	if (index >= 0) {
		file = file.substring(0, index);
	}

	// see if we are reuqesting a directory
	if (file.slice(-1) === '/') {
		file += 'index.html';
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
	} else if (file.endsWith('mov')) {
		mime = 'video/quicktime';
	} else if (file.endsWith('mp4')) {
		mime = 'video/mp4';
	} else if (file.endsWith('js')) {
		mime = 'application/javascript';
	} else if (file.endsWith('json')) {
		mime = 'text/json';
	} else {
		mime = 'text/plain';
	}

	var fullPath = path.join(documentRoot, 'static/', file);

	// source based on: http://blog.dojchinovski.mk/?p=41

	// hint: a request for 'range: bytes 42-42' requests byte 42
	// and thus the returned chunk has a length of 1
	fs.stat(fullPath, function(err, stats) {
		if (err) {
			console.log('error reading fstat: ' + err);
			notFound(response, file);
		} else {
			var total = stats.size;
			var start = 0;
			var end = total - 1;
			var responseCode = 200;

			if (request.headers.range) {
				responseCode = 206;
				var range = request.headers.range;
				var positions = range.replace(/bytes=/, "").split("-");
				var start = parseInt(positions[0], 10);
				var end = positions[1] ? parseInt(positions[1], 10) : end;
			}

			var chunksize = (end - start) + 1;
			
			var header = {
				"Content-Range": "bytes " + start + "-" + end + "/" + total, 
				"Accept-Ranges": "bytes",
				"Content-Length": chunksize,
				"Content-Type": mime,
				'Cache-Control': 'no-cache'
			};
			
			var stream = fs.createReadStream(fullPath, {start: start, end: end});
			stream.on('error', function(err) {
				console.log('error creating stream: ' + err);
				notFound(response, file);
			});

			console.log('trying to serve (chunked): ' + fullPath);
			response.writeHead(responseCode, header);
			stream.pipe(response);
		}
	});
}


/**
 * @param directory the name of the directory under the '/data/' folder
 * @param transformer The transformer object as in var transformer = require('foobar')
 * @return a Function that is the called by the router with the router specific 'this'
 */
function transformFile(directory, transformer) {
	return function(resource) {
		var fullPath = path.join(documentRoot, 'data', directory, decodeURI(resource));
		console.log('path: ' + fullPath);

		var response = this.res;

		fs.readFile(fullPath, function(err, data) {
			if (err) {
				console.log('serve Data: resource not found: ' + fullPath);
				notFound(response, fullPath);
			}
			else {
				var transformed = transformer.transformFile(data);

				var header = buildHeader(transformer.mime);
				header['content-length'] = Buffer.byteLength(transformed);

				response.writeHead(200, header);
				response.end(transformed);
			}
		})
	}
}

/**
 * @param directory the name of the directory under the '/data/' folder
 * @param transformer The transformer object as in var transformer = require('foobar')
 * @return a Function that is the called by the router with the router specific 'this'
 */
function transformFolder(directory, transformer) {
	return function(resource) {
		var fullPath = path.join(documentRoot, 'data', directory, decodeURI(resource));
		console.log('path: ' + fullPath);
		
		var response = this.res;

		transformer.transformFolder(fullPath, response);
	}
}

var listResources = function(template) {
	return function() {
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

				renderTemplate(response, template, locals)
			}
		});
	}
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
			response.writeHead(200, buildHeader('text/html'));
			response.end(mustache.render(String(file), locals));
		}
	});
}

var storeAnnotations = function() {
	return function(session, resource) {
		console.log('session: ' + session + ', ' + resource);
		console.log(this.req.body);

		var that = this;
		var body = JSON.parse(this.req.body.data);

		var fullPath = path.join(documentRoot, 'data/sessionCSV', session, resource);
		var backupPath = path.join(documentRoot, 'data/sessionCSV', session, resource + '_backup_' + guid());
		var readable = fs.createReadStream(fullPath);
		var writeable = fs.createWriteStream(backupPath);
		readable.pipe(writeable);

		writeable.on('finish', function() {
			fs.writeFile(fullPath, JSON.stringify(body, undefined, 4), function(err) {
				if (err) {
					that.res.writeHead(500);
					that.res.end('error writing annotations file!');
					console.log('error writing annotations file!');
				} else {
					that.res.writeHead(200, buildHeader('text/plain'));
					that.res.end('Annotations file saved!');
					console.log('Annotations file saved!');	
				}
			});
		});
	};
};

// routing table
var router = new director.http.Router({
	'/positions': {get: listResources('listPositions.stache') },
	'/positions/:session': { get: transformFile('/positions', positionData) },
	'/sessionCSV': { get: listResources('listSessionCSV.stache') },
	'/sessionCSV/:session': { get: transformFolder('/sessionCSV', sessionSCV) },
	'/sessionCSV/:session/:resource': { put: storeAnnotations()}
});

var server = http.createServer(function (req, response) {
	req.chunks = [];
    req.on('data', function (chunk) {
      req.chunks.push(chunk.toString());
    });

    var time = new Date().getTime();
	response.on('finish', function() {
		var delta = new Date().getTime() - time;
		console.log('request took: ' + delta + 'ms');
	})

	router.dispatch(req, response, function (err) {
		if (err) {
			// TODO find out how to do propper static routes and stop abusing 
			// the error function here.
			if (req.method === 'GET') {
				var url = req.url;
				staticFile(url, req, response)
			} else {
				response.writeHead(500);
				response.end('HTTP Method not supported!');
				console.log('HTTP method not supported');
				console.log('method: ' + req.method);
				console.log('url: ' + req.url);
				console.log(req.headers);
			}
		}
	});
});


server.listen(8080);
console.log('starting server on: 8080');