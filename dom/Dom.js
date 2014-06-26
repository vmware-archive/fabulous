/** @license MIT License (c) copyright 2010-2013 original author or authors */

/**
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @author Brian Cavalier
 * @author John Hann
*/
var paths = require('../lib/path');
var domPointer = require('../lib/domPointer');
var DomTreeMap = require('./DomTreeMap');
var DomBuilder = require('./DomBuilder');
var diff = require('./diff');
var template = require('./template');
var requestAnimationFrame = require('./requestAnimationFrame');

var fn = require('../lib/fn');

module.exports = Dom;

function Dom(node, events) {
	this.node = template.replaceContents(node);
	this._lists = findListTemplates(this.node);

	var self = this;
	this._domTreeMap = new DomTreeMap(this.node);
	this._builder = new DomBuilder(this._domTreeMap, function(path) {
		return self._generateNode(path);
	});

	this._shadowTreeMap = void 0;
	this._shadowBuilder = void 0;

	var shadow = this.node.shadowRoot;
	if(shadow) {
		shadow.innerHTML = template.fromString(shadow.innerHTML);
		this._shadowTreeMap = new DomTreeMap(shadow);
		this._shadowBuilder = new DomBuilder(this._shadowTreeMap, function(path) {
			return self._generateNode(path);
		});
	}

	this._runPatch = function() {
		self._patch();
	};

	this._patches = [];

	this._initEvents(events);
}

Dom.prototype = {
	diff: function(data) {
		if(!this._hasChanged) {
			return;
		}
		this._hasChanged = false;

		var d = diff(this._domTreeMap, data);
		if(this._shadowTreeMap) {
			d = diff(this._shadowTreeMap, data, d);
		}

		if(d && d.length > 0) {
			this._enqueuePatch(d);
		}

		return  d;
	},

	patch: function(patch) {
		this._enqueuePatch(patch);
	},

	_enqueuePatch: function(patch) {
		if(this._patches.length === 0) {
			requestAnimationFrame(this._runPatch);
		}
		this._patches.push(patch);
	},

	_patch: function() {
		while(this._patches.length > 0) {
			var p = this._patches.shift();
			this._builder.patch(p);
			if(this._shadowBuilder !== void 0) {
				this._shadowBuilder.patch(p);
			}
		}
	},

	_initEvents: function(events) {
		this._events = normalizeEvents(events);

		var observe;
		if(this._observe) {
			observe = this._observe;
			eachNodeEventPair(function(node, event) {
				node.removeEventListener(event, observe);
			}, this._events, this._doc);
		}

		observe = this._observe = this._createObserver();
		eachNodeEventPair(function(node, event) {
			node.addEventListener(event, observe, false);
		}, this._events, this._domTreeMap);
	},

	_createObserver: function() {
		var self = this;
		return function () {
			self._hasChanged = true;
		};
	},

	_generateNode: function(path) {
		var key = paths.dirname(path);
		var t = this._lists[key];
		if(t) {
			return t.template.cloneNode(true);
		}
	}
};

function normalizeEvents(events) {
	if (!events) {
		events = { '/': 'change' };
	} else if (typeof events === 'string') {
		events = { '/': events };
	}

	return events;
}

function eachNodeEventPair(f, events, reg) {
	Object.keys(events).forEach(function(path) {
		var event = events[path];
		event = event.split(/\s*,\s*/);
		event.forEach(function(event) {
			var node = reg.findNode(path);
			node && f(node, event);
		});
	});
}

function findListTemplates(root) {
	return fn.reduce(function (lists, list) {
		list.removeAttribute('data-list');
		list.parentNode.setAttribute('data-list', '');

		var path = domPointer(root, list);

		lists[paths.dirname(path)] = {
			template: list,
			parent: list.parentNode
		};

		list.parentNode.removeChild(list);

		return lists;
	}, {}, root.querySelectorAll('[data-list]'));
}
