/** @license MIT License (c) copyright 2010-2013 original author or authors */

/**
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @author: Brian Cavalier
 * @author: John Hann
 */

(function(define) { 'use strict';
define(function(require) {

	var when = require('when');
	var path = require('../lib/path');
	var Rest = require('./Rest');

	var jiff = require('jiff');
	var rebase = require('jiff/lib/rebase');

	var defaultMimeType = 'application/json-patch+json';

	function JsonPatch(client, options) {
		Rest.call(this, client, options);
		this._patchBuffer = [];
		this._inflight = 0;
	}

	JsonPatch.prototype = Object.create(Rest.prototype);

	JsonPatch.prototype.patch = function(patch) {
		if(!this.data) {
			return;
		}

		var metadata = this.metadata;
		var self = this;
		this.data = metadata.patch(this.data, patch);

		var index = this._patchBuffer.push(patch);
		this._inflight++;

		return self._send({
			method: 'PATCH',
			entity: patch.map(normalizePath)
		}).then(function(remotePatch) {
			remotePatch = rebase(self._patchBuffer.slice(index+1), remotePatch);

			if (--self._inflight === 0) {
				self._patchBuffer = [];
			}

			self.data = metadata.patch(self.data, remotePatch);
		});
	};

	JsonPatch.prototype._createDefaultClient = function(baseUrl, mimeType) {
		return Rest.prototype._createDefaultClient.call(this, baseUrl, mimeType || defaultMimeType);
	};

	function normalizePath(change) {
		change.path = path.rooted(change.path);
		return change;
	}

	return JsonPatch;

});
}(typeof define === 'function' && define.amd ? define : function(factory) { module.exports = factory(require); }));
