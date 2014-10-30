var when = require('when');
var jiff = require('jiff');

var PatchSyncClient = require('./PatchSyncClient');
var fn = require('../lib/fn');

module.exports = DSClient;

function DSClient(send, data) {
	PatchSyncClient.call(this, send, data);
	this.version = 0;
	this._remoteVersion = 0;
}

DSClient.prototype = Object.create(PatchSyncClient.prototype);
DSClient.prototype.constructor = DSClient;

DSClient.prototype.patch = function(patch) {
	this._patchLocal(patch);

	this.version += 1;
	this._patchBuffer.push({
		patch: patch,
		localVersion: this.version,
		remoteVersion: this._remoteVersion
	});
};

DSClient.prototype._send = function(msg) {
	return this._sender(msg);
};

DSClient.prototype._handleReturnPatch = function(versionedPatches) {
	this.data = when(this.data).with(this).then(function(data) {
		var self = this;

		var updated = fn.reduce(function(data, versionedPatch) {
			// Only apply patches for versions larger than the current
			var updated;
			if(versionedPatch.localVersion > self._remoteVersion) {
				updated = jiff.patch(versionedPatch.patch, data);
				self._remoteVersion = versionedPatch.localVersion;
			} else {
				updated = data;
			}

			return updated;

		}, data, versionedPatches);

		self._pruneChanges();

		return updated;
	});
};

DSClient.prototype._pruneChanges = function() {
	// Remove patches the server has acknowledged
	// IOW keep only patches that have a higher remoteVersion
	// than the version the server just told us it has.
	var remoteVersion = this._remoteVersion;
	this._patchBuffer = fn.filter(function (versionedPatch) {
		return versionedPatch.remoteVersion > remoteVersion;
	}, this._patchBuffer);
};