var fn = require('../lib/fn');
var object = require('../lib/object');
var path = require('../lib/path');
var Dom = require('./Dom');
var events = require('./events');

var Document = require('../Document');
var Observable = require('../Observable');
var Sync = require('../data/Sync');

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
	models[name] = { node: node, on: syncEvents };

	return state;
}

function initModels(defaultSignal, models, context) {
	var keys = Object.keys(models);

	return fn.map(function(key) {
		var sync = models[key];
		var signal;
		if(sync.on) {
			var on = object.find(sync.on.replace('.', '/'), context);
			signal = createObserver(on);
		}

		var s = new Sync([
			createObserver(object.find(key.replace('.', '/'), context)),
			new Dom(sync.node, signal)
		]);

		s.run(defaultSignal);
		return s;

	}, keys);
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
