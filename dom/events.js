var jsonPointer = require('jiff/lib/jsonPointer');

var fn = require('../lib/fn');
var domPointer = require('../lib/domPointer');
var form = require('../dom/form');

var curry = fn.curry;

exports.dispatch = curry(dispatch);
exports.findNode = curry(findNode);
exports.handler = curry(handler);

function dispatch(finder, handler, e) {
	var state = finder(e);

	if(state !== void 0) {
		return handler(state.node, state.value, e);
	}
}

function findNode(events, root, e) {
	var attrName = events[e.type];

	if(attrName === void 0) {
		return;
	}

	var node = e.target;
	var value;
	do {
		value = node.getAttribute(attrName);
		if(value) {
			return { node: node, value: value };
		}
	} while(node !== root && (node = node.parentNode));
}

function handler(context, root, node, value, e) {
	var path = value.replace(/\./g, '/');
	var p = jsonPointer.find(context, path);

	if (!(p && p.target && typeof p.target[p.key] === 'function')) {
		// TODO: This logs a nice, *clickable* node to the console.
		// Is there a way to do that via throw??
//		console.error('Event handler must refer to a function', node);
		throw new TypeError('Event handler must refer to a function: ' + value);
	}

	var args = [e, node];
	if (e.type === 'submit') {
		e.preventDefault();
	}

	if (node.tagName === 'FORM') {
		args.unshift(form.getValues(node));
	} else {
		var domPath = domPointer(root, node);
		var data = jsonPointer.find(context, domPath);

		if (data && data.target && data.key in data.target) {
			args.unshift(data.target[data.key]);
		} else {
			args.unshift(data.target);
		}
	}

	p.target[p.key].apply(p.target, args);

	if (e.type === 'submit' && node.tagName === 'FORM') {
		node.reset();
	}
}
