var when = require('when');
var jiff = require('jiff');
var rebase = require('jiff/lib/rebase');
var context = require('jiff/lib/context');

var defaultHash = require('./defaultHash');
var queue = require('../lib/queue');
var fn = require('../lib/fn');

var makeContext = context.makeContext(3);

module.exports = PatchClient;

function PatchClient(send, data) {
	this._sender = send;
	this._queue = queue();
	this.data = void 0;
	this._patchBuffer = [];

	this.set(data);
}

PatchClient.prototype.get = function() {
	return this.data;
};

PatchClient.prototype.set = function(data) {
	this.data = data;
	when(data).with(this).then(this._initBuffer).then(this._sendNext);
};

PatchClient.prototype._initBuffer = function() {
	this._patchBuffer = [];
};

PatchClient.prototype.diff = function(data) {
	var local = when(this.data).inspect().value;

	if(local === void 0) {
		return;
	}

	return jiff.diff(data, local, { hash: defaultHash, makeContext: makeContext });
};

PatchClient.prototype.patch = function(patch) {
	this._patchLocal(patch);
	this._patchBuffer.push(patch);
};

PatchClient.prototype._patchLocal = function(patch) {
	this.data = when(this.data).fold(jiff.patch, patch).orElse(this.data);
};

PatchClient.prototype._handleReturnPatch = function(patch) {
	this._patchBuffer.shift();
	this._patchLocal(rebase(this._patchBuffer, patch));
};

PatchClient.prototype._sendNext = function() {
	// TODO: This delay should be configurable or externalized
	// TODO: Switch to Retry-After
	return when(this._send(this._patchBuffer)).with(this)
		.then(this._handleReturnPatch)
		.catch(function(error) {
			// TODO: Need to surface this error somehow
			// TODO: Need a configurable policy on how to handle remote patch failures
			console.error(error.stack);
		})
		.delay(this._patchBuffer.length > 0 ? 500 : 2000)
		.then(this._sendNext) // Ensure sync loop continues no matter what
		.with(); // unset thisArg
};

PatchClient.prototype._send = function(buffer) {
	return this._sender(buffer[0] || []);
};
