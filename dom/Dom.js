/** @license MIT License (c) copyright 2010-2013 original author or authors */

/**
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @author Brian Cavalier
 * @author John Hann
*/
var paths = require('../lib/path');
var domPointer = require('./domPointer');
var DomTreeMap = require('./DomTreeMap');
var DomBuilder = require('./DomBuilder');
var DomDifferencer = require('./DomDifferencer');
var template = require('./template');
var requestAnimationFrame = require('./requestAnimationFrame');

var fn = require('../lib/fn');

module.exports = Dom;

function Dom(node, options) {
	if(!options) {
		options = {};
	}

	var format = options.format || {};

	this.node = template.replaceContents(node);
	this._lists = findListTemplates(this.node);

	var self = this;
	this._domTreeMap = new DomTreeMap(this.node);
	this._differencer = new DomDifferencer(this._domTreeMap, format.get);
	this._builder = new DomBuilder(this._domTreeMap, function(path) {
		return self._generateNode(path);
	}, format.set);

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

	if(typeof options.patchTransform === 'function') {
		this._transformPatch = options.patchTransform;
	}

	this._runPatch = function() {
		self._patch();
	};

	this._patches = [];

	this._observe = function () {
		self._hasChanged = true;
	};

	this._events = this._initEvents(options.events);
}

Dom.prototype = {
	get: function() {
		throw new Error('Dom cannot be a data source');
	},

	set: function(data) {
		if(data === void 0) {
			return;
		}

		var result = this._builder.build(data);

		if(this._shadowBuilder) {
			this._shadowBuilder.build(data);
		}

		return result;
	},

	diff: function(data) {
		if(!this._hasChanged) {
			return;
		}
		this._hasChanged = false;

		var d = this._differencer.diff(data);
		if(this._shadowTreeMap) {
			d = this._differencer.appendDiff(data, d);
		}

		if(d !== void 0 && d.length > 0) {
			this._enqueuePatch(d);
		}

		return this._transformPatch(d);
	},

	patch: function(patch) {
		this._enqueuePatch(this._transformPatch(patch));
	},

	_transformPatch: fn.identity,

	_enqueuePatch: function(patch) {
		if(this._patches.length === 0) {
			requestAnimationFrame(this._runPatch);
		}
		this._patches.push(patch);
	},

	_patch: function() {
		var patches = this._patches;
		this._patches = [];

		var hasShadow = this._shadowBuilder !== void 0;

		for(var i=0, l=patches.length, p; i<l; ++i) {
			p = patches[i];
			this._builder.patch(p);
			if(hasShadow) {
				this._shadowBuilder.patch(p)
			}
		}
	},

	_initEvents: function(events) {
		var ev = normalizeEvents(events);

		this.node = fn.reduce(function(self, event) {
			self.node.addEventListener(event, self._observe);
			return self;
		}, this, ev);

		return ev;
	},

	_generateNode: function(path) {
		var key = paths.basename(paths.dirname(path));
		var t = this._lists[key||''];
		if(t) {
			return t.template.cloneNode(true);
		}
	}
};

function normalizeEvents(events) {
	return events ? events.split(',') : ['change'];
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
