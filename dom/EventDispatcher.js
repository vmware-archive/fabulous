/** @license MIT License (c) copyright 2010-2013 original author or authors */

/**
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @author Brian Cavalier
 * @author John Hann
 */

var parse = require('./parse');
var reduce = Array.prototype.reduce;

module.exports = EventDispatcher;

var eventAttrs = ['change', 'submit', 'click', 'dblclick', 'keypress']
	.reduce(function(eventAttrs, e) {
		eventAttrs['data-on' + e] = e;
		return eventAttrs;
	}, Object.create(null));

var eventTypes = Object.keys(eventAttrs).reduce(function(types, attr) {
	types[eventAttrs[attr]] = attr;
	return types;
}, Object.create(null));

function EventDispatcher(handler, root) {
	this.handler = runHandler;
	this.node = root;

	var result = parse([createParser(
		{ seen: {}, events: eventAttrs, addHandler: addHandler })], root);

	this.events = result.events;

	function addHandler(event) {
		root.addEventListener(event, runHandler, false);
	}

	function runHandler(e) {
		findTarget(handler, root, e);
	}

	function findTarget(handler, root, e) {
		var type = e.type;

		if(eventTypes[type] === void 0) {
			return;
		}

		var target = e.target;
		var attr;
		do {
			attr = target.getAttribute(eventTypes[type]);
			if(attr) {
				return handler(e, target, attr);
			}
		} while(target !== root && (target = target.parentNode));
	}
}

EventDispatcher.prototype.dispose = function() {
	Object.keys(events).forEach(function(key) {
		this.root.removeEventListener(this.events[key], this.handler, false);
	}, this);
};

function createParser(state) {
	return { parse: parseEvents, state: state };
}

function parseEvents(node, state) {
	return reduce.call(node.attributes, function(state, attr) {
		var name = attr.name;
		var seen = state.seen;
		var events = state.events;
		if(events[name] !== void 0 && seen[name] === void 0) {
//			console.log('event', name, node[name], node);
			state.addHandler(events[name]);
			seen[name] = node[name] = '';
//			console.log('event', name, node[name], node);
		}
		return state;
	}, state);
}
