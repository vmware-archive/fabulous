var rest = require('rest');
var mime = require('rest/interceptor/mime');
var entity = require('rest/interceptor/entity');
var defaults = require('rest/interceptor/defaultRequest');
var pathPrefix = require('rest/interceptor/pathPrefix');

var registry = require('rest/mime/registry');
var json = require('rest/mime/type/application/json');

var localRegistry = registry.child();
localRegistry.register('application/json-patch+json', json);

var base = rest.wrap(mime, {
	mime: 'application/json',
	registry: localRegistry
}).wrap(entity);

module.exports = base;

base.get = base.wrap(defaults, { method: 'GET' });
base.put = base.wrap(defaults, { method: 'PUT' });
base.post = base.wrap(defaults, { method: 'POST' });
base['delete'] = base.wrap(defaults, { method: 'DELETE' });
base.patch = base.wrap(defaults, { method: 'PATCH' });

base.at = function at(url) {
	return base.wrap(pathPrefix, { prefix: url });
};

