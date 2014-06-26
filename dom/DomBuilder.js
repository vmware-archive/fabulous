/** @license MIT License (c) copyright 2010-2013 original author or authors */

/**
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @author Brian Cavalier
 * @author John Hann
 */

var dom = require('../lib/dom');
var isListNode = require('../lib/domPointer').isListNode;
var paths = require('../lib/path');
var fn = require('../lib/fn');

module.exports = DomBuilder;

function DomBuilder(map, create) {
	this._create = create;
	this._map = map;
}

DomBuilder.prototype.patch = function(patch) {
	return fn.reduce(function(self, p) {
		if (p.op === 'replace') {
			self.replace(p.path, p.value);
		} else if (p.op === 'add') {
			self.add(p.path, p.value);
		} else if (p.op === 'remove') {
			self.remove(p.path);
		}
		return self;
	}, this, patch);
};

DomBuilder.prototype.build = function(data) {
	var root = this._map.findNode('');
	return root && this._buildNodeValue('', data, root);
};

DomBuilder.prototype._buildNodeValue = function(path, value, node) {
	if(typeof value === 'object' && value !== null) {
		var self = this;
		return fn.map(function(key) {
			return self._addNodeValue(paths.join(path, key), value[key], node);
		}, Object.keys(value));
	}

	return dom.setValue(node, value);
};

DomBuilder.prototype.replace = function(path, value) {
	if(path === '') {
		return this.build(value);
	}
	var nodes = this._map.findNodes(path);

	var self = this;
	return fn.map(function(node) {
		return self._replaceNodeValue(path, value, node);
	}, nodes);
};

DomBuilder.prototype.add = function(path, value) {
	if(path === '') {
		return this.build(value);
	}
	var parents = this._map.findNodes(paths.dirname(path));
	var self = this;
	return fn.map(function(parent) {
		return parent && self._addNodeValue(path, value, parent);
	}, parents);
};

DomBuilder.prototype.remove = function(path) {
	var nodes = this._map.findNodes(path);

	return fn.reduce(function(map, node) {
		map.remove(node);
		var parent = node.parentNode;
		if(parent) {
			parent.removeChild(node);
		}

		return map;
	}, this._map, nodes);
};

DomBuilder.prototype._replaceNodeValue = function(path, value, node) {
	if(Array.isArray(value)) {
		return this._setNodeValueArray(insertChildAt, path, value, node);
	}

	if(typeof value === 'object' && value !== null) {
		return this._replaceNodeValueObject(path, value, node);
	}

	return dom.setValue(node, value);
};

DomBuilder.prototype._addNodeValue = function(path, value, node) {
	var list = this._findListChild(node);
	if(list) {
		return this._setNodeValueArray(insertChildAt, path, value, list);
	}

	if(Array.isArray(value)) {
		return this._setNodeValueArray(insertChildAt, path, value, node);
	}

	if(typeof value === 'object' && value !== null) {
		return this._addNodeValueObject(path, value, node);
	}

	var valueNode = this._create(path);
	if(valueNode) {
		this._map.add(path, valueNode);
	}

	var nodes = this._map.findNodes(path);
	return fn.map(function(node) {
		return dom.setValue(node, value);
	}, nodes);
};

DomBuilder.prototype._setNodeValueArray = function(insertChild, path, value, list) {
	var i = parseInt(paths.basename(path), 10);
	var replacement = this._create(path);
	var removed = insertChild(list, replacement, i);

	if(removed) {
		this._map.remove(removed);
	}

	this._map.add(path, replacement);

	return this._replaceNodeValue(path, value, replacement);
};

DomBuilder.prototype._replaceNodeValueObject = function(path, object /*, node*/) {
	var self = this;
	return fn.map(function(key) {
		var p = path + '/' + key;
		var value = object[key];

		var nodes = self._map.findNodes(p);
		return fn.map(function(node) {
			return self._replaceNodeValue(p, value, node);
		}, nodes);
	}, Object.keys(object));
};

DomBuilder.prototype._addNodeValueObject = function(path, object, node) {
	var child = this._create(path);
	if(child) {
		node.appendChild(child);
		this._map.add(path, child);

		return this._replaceNodeValue(path, object, child);
	}
};

DomBuilder.prototype._findListChild = function(node) {
	if(isListNode(node)) {
		return node;
	}

	var children = node.children;
	for(var i=0; i<children.length; ++i) {
		node = children[i];
		if(isListNode(node)) {
			return node;
		}
	}
};

function insertChildAt(parent, newNode, i) {
	var children = parent.children;

	if(i < children.length) {
		parent.insertBefore(newNode, children[i]);
	} else {
		parent.appendChild(newNode);
	}
}
