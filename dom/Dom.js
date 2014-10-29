/** @license MIT License (c) copyright 2010-2013 original author or authors */

/**
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @author Brian Cavalier
 * @author John Hann
*/
var paths = require('../lib/path');
var object = require('../lib/object');
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


	if(typeof options.patchTransform === 'function') {
		this._transformPatch = options.patchTransform;
	}

	this._runPatch = function() {
		self._patch();
	};

	this._diffRoots = [];
	this._patches = [];
	this._observe = function (e) {
		self._updateDiffRoots(e.target);
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

		return this._builder.build(data);
	},

	diff: function(data) {
		if(this._diffRoots.length === 0) {
			return;
		}

		var roots = this._diffRoots;
		this._diffRoots = [];

		var dp, p, d = [];
		for(var i=0; i<roots.length; ++i) {
			dp = domPointer(this.node, roots[i]);
			p = object.find(dp, data);
			d = this._differencer.appendDiffNode(p.target[p.key], dp, d);
		}

		if(d.length > 0) {
			this._enqueuePatch(d);
		}

		return this._transformPatch(d);
	},

	patch: function(patch) {
		this._enqueuePatch(this._transformPatch(patch));
	},

	_updateDiffRoots: function(target) {
		var roots = this._diffRoots;
		var newRoots = [];
		for(var i=0, root; i<roots.length; ++i) {
			root = roots[i];
			// If an ancestor of target is already present, no need to include target
			if(isAncestor(this.node, root, target)) {
				return;
			}

			// Retain existing roots that are not descendants of target
			// IOW *remove* descendants of target
			if(!isAncestor(this.node, target, root)) {
				newRoots.push(root);
			}
		}

		newRoots.push(target);
		this._diffRoots = newRoots;
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

		for(var i=0, l=patches.length, p; i<l; ++i) {
			p = patches[i];
			this._builder.patch(p);
		}
	},

	_initEvents: function(events) {
		var ev = normalizeEvents(events);

		this.node = fn.reduce(function(self, event) {
			self.node.addEventListener(event, self._observe);
			return self.node;
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

// Is a an ancestor of node
function isAncestor(root, a, node) {
	if(a === node) {
		return true;
	}

	if(a === root) {
		return false;
	}

	return isAncestor(root, a, node.parentNode);
}