/** @license MIT License (c) copyright 2010-2013 original author or authors */

/**
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @author Brian Cavalier
 * @author John Hann
 */

(function(define) { 'use strict';
define(function(require) {

	var paths = require('../lib/path');
	var domPointer = require('../lib/domPointer');

	function DomTreeMap(node) {
		this._root = node;
		this.rebuild();
		console.log('tree',this._tree);
	}

	DomTreeMap.prototype = {
		rebuild: function() {
			this._tree = build(this._root);
		},

		add: function(path, node) {
			var t = findParent(this._tree, path);
			if (t) {
				var key = paths.basename(path);
				if (t.isList) {
					t.list.splice(parseInt(key, 10), 0, build(node));
				} else {
					t.hash[key] = append(build(node), t.hash[key]);
				}
			}
		},

		replace: function(path, node) {
			var t = findParent(this._tree, path);
			if (t) {
				var key = paths.basename(path);
				if (t.isList) {
					t.list[key] = build(node);
				} else {
					var forest = t.hash[key];
					forest.some(function(tree, i) {
						if(tree.node === node) {
							forest.splice(i, 1);
							return true;
						}
					});
					t.hash[key] = append(build(node), forest);
				}
			}
		},

		remove: function(node) {
			var t = findParent(this._tree, domPointer(this._root, node));
			if (t) {
				var key = paths.basename(domPointer(this._root, node));
				if (t.isList) {
					t.list.splice(parseInt(key, 10), 1);
				} else {
					var forest = t.hash[key];
					forest.some(function(tree, i) {
						if(tree.node === node) {
							forest.splice(i, 1);
							return true;
						}
					});
				}
			}
		},

		findNode: function(path) {
			var t = findParent(this._tree, path);
			var key = paths.basename(path);
			if(key) {
				t = t && getSubtree(t, key);
			}
			return t && t.node;
		},

		findNodes: function(path) {
			var t = findParent(this._tree, path);
			var key = paths.basename(path);
			if(key) {
				t = t && getSubtree(t, key);
			}

			if(t === void 0) {
				return [];
			}

			return Array.isArray(t) ? t.map(function(t) {
				return t.node;
			}) : [t.node];
		}
	};

	return DomTreeMap;

	function findParent(tree, path) {
		var parts = paths.split(paths.dirname(path));
		return parts.reduce(function(tree, part) {
			return (tree && part) ? getSubtree(tree, part) : tree;
		}, tree);
	}

	function getSubtree(tree, key) {
		return tree && tree.isList ? get(tree.list, key) : get(tree.hash, key);
	}

	function get(obj, key) {
		return obj === void 0 ? void 0 : obj[key];
	}

	function build(node) {
		return appendChildren({ node: node, hash: void 0, list: void 0, isList: false }, node);
	}

	function appendChildren(tree, node) {
		if(domPointer.isListNode(node)) {
			tree.isList = true;
			return appendListChildren(tree, node.children);
		}

		return appendHashChildren(tree, node.children);
	}

	function appendListChildren(tree, children) {
		var list = tree.list === void 0
			? (tree.list = []) : tree.list;

		for(var i=0; i<children.length; ++i) {
			list.push(build(children[i]));
		}
		return tree;
	}

	function appendHashChildren(tree, children) {
		var hash = tree.hash === void 0
			? (tree.hash = Object.create(null)) : tree.hash;

		var i, child, key;
		for(i=0; i<children.length; ++i) {
			child = children[i];
			if(child.hasAttribute('data-path')) {
				key = child.getAttribute('data-path');
				hash[key] = append(build(child), hash[key]);
			} else if(child.hasAttribute('name')) {
				key = child.getAttribute('name');
				hash[key] = append(build(child), hash[key]);
			} else {
				appendChildren(tree, child);
			}
		}
		return tree;
	}

	function append(x, list) {
		if(list === void 0) {
			return [x];
		}
		list.push(x);
		return list;
	}

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));
