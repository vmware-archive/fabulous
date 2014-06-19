var rest = require('rest');
var mime = require('rest/interceptor/mime');
var entity = require('rest/interceptor/entity');
var defaults = require('rest/interceptor/defaultRequest');

var base = rest.wrap(mime, { mime: 'application/json' }).wrap(entity);

module.exports = base;

base.get = base.wrap(defaults, { method: 'GET' });
base.put = base.wrap(defaults, { method: 'PUT' });
base.post = base.wrap(defaults, { method: 'POST' });
base['delete'] = base.wrap(defaults, { method: 'DELETE' });
base.patch = base.wrap(defaults, { method: 'PATCH' });

