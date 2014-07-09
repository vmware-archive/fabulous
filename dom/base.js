/** @license MIT License (c) copyright 2013 original authors */
var containsImpl = getContainsImpl;

var formTypes = { 'INPUT': 1, 'SELECT': 1, 'TEXTAREA': 1 };
var formClickables = { 'CHECKBOX': 1, 'RADIO': 1 };

exports.contains = contains;
exports.findIndex = findIndex;
exports.insertAt = insertAt;
exports.guessProp = guessPropFor;
exports.setValue = setValue;
exports.getValue = getValue;

/**
 * Returns true if refNode contains testNode in its hierarchy.
 * @param {Node} refNode
 * @param {Node} testNode
 * @return {Boolean}
 */
function contains(refNode, testNode) {
	return containsImpl(refNode, testNode);
}

function insertAt(parent, i, child) {
	var children = parent.children;
	if(i >= children.length) {
		return parent.appendChild(child);
	}

	return parent.insertBefore(child, parent.children[i]);
}

function findIndex(container, node) {
	var children = container.children;
	for(var i=0; i<children.length; ++i) {
		if(node === children[i]) {
			return i;
		}
	}

	throw new Error('node not in container');
}

/**
 * Determines the DOM method used to compare the relative positions
 * of DOM nodes and returns an abstraction function.
 * @private
 * @return {Function} function (refNode, testNode) { return boolean; }
 */
function getContainsImpl () {
	if (typeof document != 'undefined' && document.compareDocumentPosition) {
		// modern browser
		containsImpl = function (refNode, testNode) {
			return (refNode.compareDocumentPosition(testNode) & 16) == 16;
		};
	}
	else {
		// assume legacy IE
		containsImpl = function (refNode, testNode) {
			return refNode.contains(testNode);
		};
	}
	return containsImpl.apply(null, arguments);
}

function isFormValueNode (node) {
	return node.nodeName && node.nodeName.toUpperCase() in formTypes;
}

function isClickableFormNode (node) {
	return isFormValueNode(node)
		&& node.type && node.type.toUpperCase() in formClickables;
}

function guessPropFor (node) {
	return isFormValueNode(node)
		? isClickableFormNode(node) ? 'checked' : 'value'
		: 'textContent';
}

function setValue(node, value) {
	node[guessPropFor(node)] = value;
}

function getValue(node) {
	return node[guessPropFor(node)];
}

