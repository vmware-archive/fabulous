var jsonPointer = require('jiff/lib/jsonPointer');

var EventDispatcher = require('../dom/EventDispatcher');
var domPointer = require('../lib/domPointer');
var Sync = require('../data/Sync');
var Property = require('../data/Property');
var Dom = require('../dom/Dom');
var form = require('../dom/form');

module.exports = buildViewContext;

function buildViewContext(node, builder) {
	return function(context) {
		context._events = bindEvents(context, node);
		var destroy = builder(node, context);

		context = initBindings(node.querySelectorAll('[data-model]'), context);

		if(typeof destroy !== 'function') {
			return disposeEvents;
		}

		return function(context) {
			disposeEvents(context);
			return destroy(context);
		};
	};
}

function disposeEvents(context) {
	context._events.dispose();
}

function bindEvents (exports, root) {
	return new EventDispatcher(function (e, target, attr) {
		var path = attr.replace(/\./g, '/');
		var p = jsonPointer.find(exports, path);

		if (p && p.target && typeof p.target[p.key] === 'function') {
			var args = [e, target];
			if(e.type === 'submit') {
				e.preventDefault();
			}

			if (target.tagName === 'FORM') {
				args.unshift(form.getValues(target));
			} else {
				var domPath = domPointer(root, e.target);
				var data = jsonPointer.find(exports.todos, domPath);

				if (data && data.target && data.key in data.target) {
					args.unshift(data.target[data.key]);
				}
			}

			p.target[p.key].apply(p.target, args);

			if (e.type === 'submit' && target.tagName === 'FORM') {
				target.reset();
			}
		}

	}, root);
}

function initBindings (nodes, context) {
	return Array.prototype.reduce.call(nodes, function (context, node) {
		var key = node.getAttribute('data-model');
		var model = context[key];

		var property = isSync(model) ? model : new Property(context, key);

		var sync = context['_' + key + 'Sync'] = new Sync([new Dom(node), property]);

		context.scheduler.add(function () {
			sync.sync();
			return 20;
		});

		return context;
	}, context);
}

function isSync(x) {
	return x != null && typeof x.diff === 'function' && typeof x.patch === 'function';
}