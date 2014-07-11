var when = require('when');
var jiff = require('jiff');
var context = require('jiff/lib/context');

var defaultHash = require('./defaultHash');
var queue = require('../lib/queue');
var fn = require('../lib/fn');

var makeContext = context.makeContext(3);

module.exports = DSClient;

function DSClient(send, fetch) {
	this._sender = send;
	this._fetcher = fetch || this._sender;
	this._queue = queue();
	this.data = void 0;

	this._patchBuffer = [];
	this.version = 0;
	this._remoteVersion = 0;
}

DSClient.prototype.get = function() {
	return this._fetch().with(this)
		.then(function (data) {
			this.data = data;
			return jiff.clone(data);
		});
};

DSClient.prototype.set = function() {
	// TODO: Should we allow this?  Seems safe enough
	// Problem case: might get clobbered by inflight fetch() result
	throw new Error('setting data not allowed');
};

DSClient.prototype.diff = function(data) {
	if(this.data === void 0) {
		return;
	}

	return jiff.diff(data, this.data, { hash: defaultHash, makeContext: makeContext });
};

DSClient.prototype.patch = function(patch) {
	this._patchLocal(patch);

	this.version += 1;
	this._patchBuffer.push({
		patch: patch,
		localVersion: this.version,
		remoteVersion: this._remoteVersion
	});

	return this._send(this._patchBuffer).with(this)
		.then(this._handleReturnPatch);
};

DSClient.prototype._patchLocal = function(patch) {
	if(this.data === void 0) {
		return;
	}

	this.data = jiff.patch(patch, this.data);
};

DSClient.prototype._handleReturnPatch = function(versionedPatches) {
	var self = this;

	this.data = fn.reduce(function(data, versionedPatch) {
		// Only apply patches for versions larger than the current
		var updated;
		if(versionedPatch.localVersion > self._remoteVersion) {
			updated = jiff.patch(versionedPatch.patch, data);
			self._remoteVersion = versionedPatch.localVersion;
		} else {
			updated = data;
		}

		return updated;

	}, this.data, versionedPatches);

	this._pruneChanges();
};

DSClient.prototype._fetch = function() {
	return this._queue(this._fetcher);
};

DSClient.prototype._send = function(msg) {
	return this._queue(this._sender, { method: 'PATCH', entity: msg });
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