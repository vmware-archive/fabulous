var fn = require('../lib/fn');
var Dom = require('../dom/dom');
var Sync = require('../data/Sync');
var path = require('../lib/path');
var events = require('./events');
var Observer = require('../data/Observer');

var Stream = require('most/Stream');

var jsonPointer = require('jiff/lib/jsonPointer');

var eventAttrs = fn.reduce(function(eventAttrs, e) {
	eventAttrs['data-on' + e] = e;
	return eventAttrs;
}, Object.create(null), ['change', 'submit', 'click', 'dblclick', 'keypress', 'focus', 'blur']);

module.exports = scanner;

// TODO: scanner should return something sensible,
// possibly a new destroy function that will clean up
// all the things it did.
function scanner(node, state) {
	return scanView(void 0, node, state);
}

function scan(node, state) {
	var s = node.getAttribute('data-view');
	if(s) {
		state = scanView(s, node, pushState(state));
	} else {
		state = collectEvents(node, scanChildren(node, state));
	}

	if(node.hasAttribute('data-model')) {
		state = initModel(node.getAttribute('data-model'), node, state);
	}

	return state;
}

function collectEvents(node, state) {
	return fn.reduce(function(state, attr) {
		var name = attr.name;
		if(eventAttrs[name] !== void 0) {
			// TODO: This needs to collect both the node and the name
			// Since some events (blur, focus) don't bubble, we have to
			// directly attach some handlers
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

	return Object.keys(state.events).reduce(function(node, event) {
		node.addEventListener(event, dispatcher, false);
		return node;
	}, node);
}

function initModel(name, node, state) {
	var context = state.context;

	var observer = createObserver(jsonPointer.find(context, name));

	var sync = context['_' + name + 'Sync'] = new Sync([new Dom(node), observer]);

	// FIXME: Externalize this
	context.scheduler.add(function () {
		sync.sync();
		return 20;
	});

	return state;
}

function createObserver (p) {
	var model = p.target[p.key];
	var observer;

	if (isObserver(model)) {
		observer = model;
	} else if (typeof model === 'function') {
		observer = Observer.fromFunction(model, p.target);
	} else if (model instanceof Stream) {
		observer = Observer.fromStream(model);
	} else {
		observer = Observer.fromProperty(p.key, p.target);
	}

	return observer;
}

function scanView(name, node, state) {
	var create = state.context[name];

	if(typeof create === 'function') {
		create(node, state.context);
	}

	var newState = scanChildren(node, state);
	newState = collectEvents(node, newState);
	addEvents(node, newState);
	return newState;
}

function scanChildren(node, state) {
	return fn.reduce(function(state, node) {
		scan(node, state);
		return state;
	}, state, node.children);
}

function isObserver(x) {
	return x != null && typeof x.diff === 'function' && typeof x.patch === 'function';
}

function pushState(s) {
	return Object.create(s, {
		context: { value: Object.create(s.context) },
		events: { value: Object.create(null) }
	});
}
