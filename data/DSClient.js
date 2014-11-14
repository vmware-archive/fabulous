var when = require('when');
var jiff = require('jiff');

var PatchSyncClient = require('./PatchSyncClient');
var fn = require('../lib/fn');

module.exports = DSClient;

function DSClient(send, data, store) {
	PatchSyncClient.call(this, send, data, store);
	this.version = 0;
	this._remoteVersion = 0;
}

DSClient.prototype = Object.create(PatchSyncClient.prototype);
DSClient.prototype.constructor = DSClient;

DSClient.prototype.patch = function(patch) {
	this._patchLocal(patch);

	this.version += 1;
	var patchBuffer = this.patchStore.get();

	patchBuffer.push({
		patch: patch,
		localVersion: this.version,
		remoteVersion: this._remoteVersion
	});

	this.patchStore.set(patchBuffer);
};

DSClient.prototype._initBuffer = function() {
	PatchSyncClient.prototype._initBuffer.call(this);
	var patchBuffer = this.patchStore.get();

	if(patchBuffer.length > 0) {
		this.version = patchBuffer[patchBuffer.length - 1].localVersion;
	}
};

DSClient.prototype._handleReturnPatch = function(versionedPatches) {
	var data = this.dataStore.get();
	data = when(data).with(this).then(function(data) {
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

	this.dataStore.set(data);
	return data;
};

DSClient.prototype._pruneChanges = function() {
	// Remove patches the server has acknowledged
	// IOW keep only patches that have a higher remoteVersion
	// than the version the server just told us it has.
	var remoteVersion = this._remoteVersion;
	var patchBuffer = this.patchStore.get();

	patchBuffer = fn.filter(function (versionedPatch) {
		return versionedPatch.remoteVersion > remoteVersion;
	}, patchBuffer);

	this.patchStore.set(patchBuffer);
};