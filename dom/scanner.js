var fn = require('../lib/fn');
var Dom = require('../dom/dom');
var Property = require('../data/Property');
var Sync = require('../data/Sync');
var path = require('../lib/path');

var reduce = fn.reduce;
var map = fn.map;

var eventAttrs = reduce(function(eventAttrs, e) {
	eventAttrs['data-on' + e] = e;
	return eventAttrs;
}, Object.create(null), ['change', 'submit', 'click', 'dblclick', 'keypress']);

var eventTypes = reduce(function(types, attr) {
	types[eventAttrs[attr]] = attr;
	return types;
}, Object.create(null), Object.keys(eventAttrs));

module.exports = scanner;

function scanner(node, context) {
	return scan(node, node, context);
}

function scan(root, node, context) {
	context = processEvents(root, node, context);

	if(node.hasAttribute('data-model')) {
		context = processModel(node.getAttribute('data-model'), node, context);
	}

	s = node.getAttribute('data-view');
	if(s) {
		return scanView(s, node, context)
	} else {
		return scanChildren(root, node, context);
	}
}

function processEvents(root, node, context) {
	return reduce(function(context, attr) {
		var name = attr.name;
		if(eventAttrs[name] !== void 0) {
			console.log(name, eventAttrs[name], root);
		}
		return context;
	}, context, node.attributes);
}

function processModel(name, node, context) {
	var model = find(name, context);

	var property = isSync(model) ? model : new Property(context, name);
	var sync = context['_' + name + 'Sync'] = new Sync([new Dom(node), property]);

	context.scheduler.add(function () {
		sync.sync();
		return 20;
	});

	return context;
}

function scanView(name, node, context) {
	var create = context[name];

	// TODO: throw if create !== function?
	var child = typeof create === 'function'
		? createView(node, create, Object.create(context))
		: Object.create(context);

	return scanChildren(node, node, child);
}

function createView(node, builder, context) {
	return builder(node, scanner(node, context));
}

function scanChildren(root, node, context) {
	return fn.chain(function(node) {
		return scan(root, node, context);
	}, node.children);
}

function find(p, o) {
	return path.split(p).reduce(function(o, k) {
		return o == null ? o : o[k];
	}, o);
}

function isSync(x) {
	return x != null && typeof x.diff === 'function' && typeof x.patch === 'function';
}