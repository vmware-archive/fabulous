var fn = require('../lib/fn');
var Dom = require('../dom/dom');
var Property = require('../data/Property');
var Sync = require('../data/Sync');
var path = require('../lib/path');
var events = require('./events');

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
	var model = find(name, context);

	var property = isSync(model) ? model : new Property(context, name);
	var sync = context['_' + name + 'Sync'] = new Sync([new Dom(node), property]);

	context.scheduler.add(function () {
		sync.sync();
		return 20;
	});

	return state;
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

function find(p, o) {
	return path.split(p).reduce(function(o, k) {
		return o == null ? o : o[k];
	}, o);
}

function isSync(x) {
	return x != null && typeof x.diff === 'function' && typeof x.patch === 'function';
}

function pushState(s) {
	return Object.create(s, {
		context: { value: Object.create(s.context) },
		events: { value: Object.create(null) }
	});
}

