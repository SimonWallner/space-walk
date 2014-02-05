#!/usr/bin/env node

var http = require('http');
var url = require("url");
var fs = require("fs");
var path = require("path");

 // monkey patching
 String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

var documentRoot = process.cwd();

var quickResponse = function(response, status, message) {
	response.writeHead(status);
	response.write(message);
	response.end();
}

var directoryListing = function(response) {
	fs.readdir(path.join(documentRoot, '/'), function(err, files) {
		if (err) {
			quickResponse(response, 500, 'reading the directory failed');
		}
		else {
			var data = {resources: files};
			response.writeHead(200);
			response.write(JSON.stringify(data));
			response.end();
		}
	})
}

var serveJson = function(absolutePathName, response) {
	fs.exists(absolutePathName, function(exists) {
		if (!exists) {
			quickResponse(response, 404, 'resource not found: ' + absolutePathName);
		}
		else {
			fs.readFile(absolutePathName, function(err, data) {
				if (err) {
					quickResponse(response, 404, 'error reading resource + absolutePathName');
				}
				else {
					try {
						json = JSON.parse(data);
						response.writeHead(200);
						response.write(JSON.stringify(json));
						response.end();
					}
					catch (err)
					{
						quickResponse(response, 500, 'error parsing JSON file');
						console.log(err);
					}
					
				}
			})
		}
	})
}

var serveResource = function(absolutePathName, response) {
	fs.exists(absolutePathName, function(exists) {
		if (!exists) {
			quickResponse(response, 404, 'resource not found: ' + absolutePathName);
		}
		else {
			fs.readFile(absolutePathName, function(err, data) {
				if (err) {
					quickResponse(response, 404, 'error reading resource + absolutePathName');
				}
				else {
					response.writeHead(200);
					response.write(data);
					response.end();
				}
			})
		}
	})
}

var dispatch = function(request, response) {
	// CORS header
	response.setHeader('Access-Control-Allow-Origin', '*');

	var requestPath = url.parse(request.url).pathname;
	var fullPath = path.join(documentRoot, requestPath);
		
	if (requestPath === '/') {
		directoryListing(response);
	}
	else if(requestPath.endsWith('.json')) {
		serveJson(fullPath, response);
	}
	else {
		serveResource(fullPath, response);
	}
}

var server = http.createServer(dispatch);

server.listen(8000, function() {
	console.log((new Date()) + ' Server is listening on port 8000');
});


