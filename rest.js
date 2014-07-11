var rest = require('rest');
var mime = require('rest/interceptor/mime');
var entity = require('rest/interceptor/entity');
var errorCode = require('rest/interceptor/errorCode');
var defaults = require('rest/interceptor/defaultRequest');
var pathPrefix = require('rest/interceptor/pathPrefix');

var registry = require('rest/mime/registry');
var json = require('rest/mime/type/application/json');

var localRegistry = registry.child();
localRegistry.register('application/json-patch+json', json);

var base = rest
	.wrap(errorCode)
	.wrap(mime, {
		mime: 'application/json',
		registry: localRegistry
	})
	.wrap(entity);

module.exports = decorate(base);

function at(url, base) {
	return decorate(base.wrap(pathPrefix, { prefix: url }));
}

function decorate(client) {
	client.get       = client.wrap(defaults, { method: 'GET' });
	client.put       = client.wrap(defaults, { method: 'PUT' });
	client.post      = client.wrap(defaults, { method: 'POST' });
	client['delete'] = client.wrap(defaults, { method: 'DELETE' });
	client.patch     = client.wrap(defaults, { method: 'PATCH' });

	client.at = function(url) {
		return at(url, client);
	};

	return client;
}