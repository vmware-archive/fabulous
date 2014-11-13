var when = require('when');
var jiff = require('jiff');
var rebase = require('jiff/lib/rebase');
var context = require('jiff/lib/context');

var defaultHash = require('./defaultHash');
var fn = require('../lib/fn');
var MemoryStore = require('../lib/store/MemoryStore');

var makeContext = context.makeContext(3);

module.exports = PatchSyncClient;

function PatchSyncClient(send, data, store) {
	this.data = void 0;
	this.store = store || new MemoryStore();

	this._send = send;
	this._running = false;

	this.set(data);
}

PatchSyncClient.prototype.get = function() {
	return this.data;
};

PatchSyncClient.prototype.set = function(data) {
	this.data = data;
	this._startSync();
};

PatchSyncClient.prototype._startSync = function() {
	if(this._running) {
		return;
	}
	this._running = true;
	when(this.data).with(this).then(this._initBuffer).then(this._sendNext);
};

PatchSyncClient.prototype._stopSync = function() {
	this._running = false;
};

PatchSyncClient.prototype._initBuffer = function() {
	var patchBuffer = this.store.get();
	if(patchBuffer == null) {
		patchBuffer = [];
		this.store.set(patchBuffer);
	}
	return this.store;
};

PatchSyncClient.prototype.diff = function(data) {
	var local = when(this.data).inspect().value;

	if(local === void 0) {
		return;
	}

	return jiff.diff(data, local, { hash: defaultHash, makeContext: makeContext });
};

PatchSyncClient.prototype.patch = function(patch) {
	this._patchLocal(patch);

	var patchBuffer = this.store.get();
	patchBuffer.push(patch);
	this.store.set(patchBuffer);
};

PatchSyncClient.prototype._patchLocal = function(patch) {
	this.data = when(this.data).fold(jiff.patch, patch).orElse(this.data);
};

PatchSyncClient.prototype._handleReturnPatch = function(patch) {
	var patchBuffer = this.store.get();
	patchBuffer.shift();
	this.store.set(patchBuffer);

	this._patchLocal(rebase(patchBuffer, patch));
};

PatchSyncClient.prototype._sendNext = function() {
	if(!this._running) {
		return when.resolve();
	}

	var patchBuffer = this.store.get();
	var patch = (patchBuffer && patchBuffer[0]) || [];

	// TODO: The delay should be configurable or externalized
	// TODO: Switch to Retry-After
	return when(this._send(patch)).with(this)
		.then(this._handleReturnPatch)
		.catch(function(error) {
			// TODO: Need to surface this error somehow
			// TODO: Need a configurable policy on how to handle remote patch failures
			console.error(error.stack);
		})
		.delay(patchBuffer.length > 0 ? 500 : 2000)
		.then(this._sendNext)
		.with(); // unset thisArg
};
