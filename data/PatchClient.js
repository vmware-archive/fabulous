var when = require('when');
var jiff = require('jiff');
var context = require('jiff/lib/context');

var defaultHash = require('./defaultHash');
var queue = require('../lib/queue');
var fn = require('../lib/fn');

var makeContext = context.makeContext(3);

module.exports = PatchClient;

function PatchClient(client, data) {
	this._sender = client;
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
	when(data).with(this).then(this._initBuffer);
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

	return this._sendNext();
};

PatchClient.prototype._patchLocal = function(patch) {
	this.data = when(this.data).fold(jiff.patch, patch).orElse(this.data);
};

PatchClient.prototype._handleReturnPatch = function(patch) {
	this._patchLocal(patch);
};

PatchClient.prototype._sendNext = function() {
	return this._send(this._patchBuffer)
		.with(this)
		.then(this._handleReturnPatch);
};

PatchClient.prototype._send = function(buffer) {
	if(buffer.length) {
		this._queue(this._sender, buffer.shift())
			.with(this)
			.then(this._handleReturnPatch);
	}

	return when.resolve();
};
