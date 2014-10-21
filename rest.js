var rest = require('rest');
var mime = require('rest/interceptor/mime');
var errorCode = require('rest/interceptor/errorCode');
var defaults = require('rest/interceptor/defaultRequest');
var pathPrefix = require('rest/interceptor/pathPrefix');

var registry = require('rest/mime/registry');
var json = require('rest/mime/type/application/json');

var localRegistry = registry.child();
var jsonPatchType = 'application/json-patch+json';
var defaultProps = {
	get:  { method: 'GET' },
	put:  { method: 'PUT' },
	post: { method: 'POST' },
	'delete': { method: 'DELETE' },
	patch: {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json-patch+json' }
	}
};

localRegistry.register(jsonPatchType, json);

var base = rest
	.wrap(errorCode)
	.wrap(mime, {
		mime: 'application/json',
		registry: localRegistry
	});

module.exports = decorate(base);

function at(url, base) {
	return decorate(base.wrap(pathPrefix, { prefix: url }));
}

function decorate(client) {
	for(var p in defaultProps) {
		client[p] = client.wrap(defaults, defaultProps[p]);
	}

	client.at = function(url) {
		return at(url, client);
	};

	return client;
}