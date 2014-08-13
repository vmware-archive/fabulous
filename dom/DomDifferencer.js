/** @license MIT License (c) copyright 2010-2013 original author or authors */

/**
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @author Brian Cavalier
 * @author John Hann
 */

var base = require('./base');
var isListNode = require('./domPointer').isListNode;
var paths = require('../lib/path');
var fn = require('../lib/fn');

module.exports = DomDifferencer;

function defaultGetValue(node) {
	return base.getValue(node.node);
}

function DomDifferencer(map, getValue) {
	this._map = map;
	this._getValue = typeof getValue === 'function' ? getValue : defaultGetValue;
}

DomDifferencer.prototype.diff = function(data) {
	return this.appendDiff(data, []);
};

DomDifferencer.prototype.appendDiff = function(data, patch) {
	var nodes = this._map.find('');
	var self = this;
	return fn.reduce(function(patch, node) {
		return self.diffNode(data, '', node, patch);
	}, patch, nodes);
};

DomDifferencer.prototype.diffNode = function(data, path, node, patch) {
	return this._runDiff({}, data, path, node, patch);
};

DomDifferencer.prototype._runDiff = function(seen, value, path, node, patch) {
	seen[path] = 1;

	if(isContainer(value)) {
		return this._diffContainer(seen, value, path, patch);
	}

	var nodeValue = this._getValue(path, node);
	return nodeValue != value
		? addReplace(path, nodeValue, value, patch)
		: patch;
};

DomDifferencer.prototype._diffContainer = function(seen, data, path, patch) {
	if(Array.isArray(data)) {
		return this._diffArray(seen, data, path, patch);
	}

	var self = this;
	return fn.reduce(function(patch, key) {

		var local = paths.join(path, key);
		var nodes = self._map.find(local);

		if(nodes.length === 0) {
			return addRemove(data[key], local, patch);
		}

		return fn.reduce(function(patch, node) {
			return self._runDiff(seen, data[key], local, node, patch);
		}, patch, nodes);

	}, patch, Object.keys(data));
};

DomDifferencer.prototype._diffArray = function(seen, array, path, patch) {
	var self = this;
	var parents = this._map.find(path);

	return fn.reduce(function(patch, parent) {
		var list = findListChild(parent.node);
		if(!list) { // TODO: throw?
			return patch;
		}

		//for(var i= 0, l=list.children.length; ++i) {
		//	var nodes = self._map.find(paths.join(path, ''+i));
		//	patch = fn.reduce(function(patch, node) {
		//
		//	})
		//	patch =
		//}
		return parent.list.reduce(function(patch, node, i) {
			return self._runDiff(seen, array[i], paths.join(path, ''+i), node, patch);
		}, patch);
	}, patch, parents);
};

function isContainer(x) {
	return x && !(x instanceof Date) && (Array.isArray(x) || typeof x === 'object');
}

function findListChild(node) {
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
}

function addReplace (value, nodeValue, path, patch) {
	patch.push({ op: 'test', path: path, value: value });
	patch.push({ op: 'replace', path: path, value: nodeValue });
	return patch;
}

function addRemove (value, path, patch) {
	patch.push({ op: 'test', path: path, value: value });
	patch.push({ op: 'remove', path: path });
	return patch;
}
