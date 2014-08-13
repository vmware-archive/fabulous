/** @license MIT License (c) copyright 2010-2013 original author or authors */

/**
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @author Brian Cavalier
 * @author John Hann
 */

var path = require('./../lib/path');
var findIndex = require('./base').findIndex;

module.exports = domPointer;

domPointer.isListNode = isListNode;

function domPointer (end, start) {
	var segment, p = '';
	while (start && start !== end && typeof start.getAttribute === 'function') {
		if(start.parentNode && isListNode(start.parentNode)) {
			segment = String(findIndex(start.parentNode, start));
		} else {
			segment = start.getAttribute('data-model');
			if(segment) {
				return path.join(segment.split(/\s*\|\s*/)[0], p);
			}
			segment = start.getAttribute('name') || start.getAttribute('data-path');
		}

		p = path.join(segment, p);

		if (path.isAbsolute(p)) {
			return p;
		}
		start = start.parentNode;
	}

	return p;
}

function isListNode (node) {
	return typeof node.hasAttribute === 'function' && node.hasAttribute('data-list');
}
