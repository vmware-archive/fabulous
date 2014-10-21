var fn = require('../lib/fn');
var object = require('../lib/object');
var path = require('../lib/path');
var Dom = require('./Dom');
var base = require('./base');
var events = require('./events');

var Document = require('../Document');
var Observable = require('../Observable');
var Sync = require('../data/Sync');

var defaultGetValue = base.getValue;
var defaultSetValue = base.setValue;

var eventAttrs = fn.reduce(function(eventAttrs, e) {
	eventAttrs['on'+e] = eventAttrs['data-on'+e] = e;
	return eventAttrs;
}, {}, ['change', 'click', 'dblclick', 'keypress', 'submit', 'focus', 'blur']);

module.exports = scanner;

// TODO: scanner should return something sensible,
// possibly a new destroy function that will clean up
// all the things it did.
function scanner(node, context) {
	return scanView(void 0, node, { context: context, events: {}, models: {} });
}

function scan(node, state) {
	if(node.hasAttribute('data-model')) {
		state = scanModel(node.getAttribute('data-model'), node, state);
	}

	var s = node.getAttribute('data-view');
	if(s) {
		state = scanView(s, node, pushState(state));
	} else {
		state = scanEvents(node, scanChildren(node, state));
	}

	return state;
}

function scanView(name, node, state) {
	var create = state.context[name];

	if(typeof create === 'function') {
		create(node, state.context);
	}

	var newState = scanChildren(node, state);
	newState = scanEvents(node, newState);

	newState.syncs = initModels(Observable.periodic(20), newState.models, newState.context);
	newState.eventDispatcher = addEvents(node, newState);

	return newState;
}

function scanChildren(node, state) {
	return fn.reduce(function(state, node) {
		scan(node, state);
		return state;
	}, state, node.children);
}

function scanEvents(node, state) {
	return fn.reduce(function(state, attr) {
		var name = attr.name;
		if(eventAttrs[name] !== void 0) {
			// TODO: This needs to collect both the node and the name
			// Since some events (blur, focus) don't bubble, we have to
			// directly attach some handlers
			if(!/^data-on/.test(name)) {
				node.setAttribute('data-' + name, node.getAttribute(name));
				node[name] = '';
				node.removeAttribute(name);
				name = 'data-' + name;
			}

			state.events[eventAttrs[name]] = name;
		}
		return state;
	}, state, node.attributes);
}

function addEvents(node, state) {
	var handler = events.handler(state.context, node);
	var finder = events.findNode(state.events, node);
	var dispatcher = events.dispatch(finder, handler);
	state.eventDispatcher = dispatcher;

	return fn.reduce(function(dispatcher, event) {
		node.addEventListener(event, dispatcher, false);
		return dispatcher;
	}, dispatcher, Object.keys(state.events));
}

function scanModel(name, node, state) {
	var models = state.models;

	var syncEvents = node.getAttribute('data-sync');
	models[name] = append({ node: node, on: syncEvents }, models[name]);

	return state;
}

function initModels(defaultSignal, models, context) {
	var keys = Object.keys(models);

	var format = createFormatter(context);

	return fn.map(function(key) {

		var model = key.split(/\s*\|\s*/);

		return fn.map(function(sync) {
			return initModelSync(model, defaultSignal, sync, context, format);
		}, models[key]);

	}, keys);
}

function initModelSync (model, defaultSignal, sync, context, format) {
	var transform = model[1];
	var signal = defaultSignal;
	if (sync.on) {
		var on = object.find(sync.on.replace('.', '/'), context);
		if (on) {
			signal = on.target[on.key];
		}
	}

	var patchTransform;
	if (transform) {
		patchTransform = object.find(transform.replace('.', '/'), context);
	}

	var s = new Sync([
		createObserver(object.find(model[0].replace('.', '/'), context)),
		new Dom(sync.node, {
			events: void 0,//signal,
			format: format,
			patchTransform: patchTransform
				? patchTransform.target[patchTransform.key]
				: void 0
		})
	]);

	s.run(signal);
	return s;
}

function createFormatter (context) {
	return {
		get: function (path, node) {
			if (node.format === void 0) {
				return defaultGetValue(node.node);
			}
			return context[node.format].get(node.node);
		},
		set: function (value, path, node) {
			if (node.format === void 0) {
				return defaultSetValue(node.node, value);
			}
			return context[node.format].set(value, node.node);
		}
	};
}

function createObserver (p) {
	var x = p.target[p.key];
	var doc;

	if (isDocument(x)) {
		doc = x;
	} else if (isObservable(x)) {
		doc = Document.fromObservable(x);
	} else if (typeof x === 'function') {
		doc = Document.fromFunction(x, p.target);
	} else {
		doc = Document.fromProperty(p.key, p.target);
	}

	return doc;
}

function append(x, list) {
	if(list === void 0) {
		return [x];
	}

	list.push(x);
	return list;
}

function isDocument(x) {
	return x != null && typeof x.diff === 'function' && typeof x.patch === 'function';
}

function isObservable(x) {
	return x instanceof Observable.Stream;
}

function pushState(s) {
	return Object.create(s, {
		context: { value: Object.create(s.context) },
		events: { value: {} },
		models: { value: {} }
	});
}
