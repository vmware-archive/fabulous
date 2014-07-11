var when = require('when');
var jiff = require('jiff');
var rebase = require('jiff/lib/rebase');
var context = require('jiff/lib/context');

var defaultHash = require('./defaultHash');
var queue = require('../lib/queue');
var fn = require('../lib/fn');

var makeContext = context.makeContext(3);

module.exports = PatchClient;

function PatchClient(send, fetch) {
	this._sender = send;
	this._fetcher = fetch || this._sender;
	this._queue = queue();
	this.data = void 0;

	this._patchBuffer = [];
}

PatchClient.prototype.get = function() {
	var self = this;
	return this._fetch().then(function(data) {
		self.data = fn.reduce(function(data, patch) {
			return jiff.patch(patch, data);
		}, data, self._patchBuffer);

		return jiff.clone(data);
	}).tap(function() {
		self._sendNext();
	});
};

PatchClient.prototype.set = function() {
	// TODO: Should we allow this?  Seems safe enough
	// Problem case: might get clobbered by inflight fetch() result
	throw new Error('setting data not allowed');
};

PatchClient.prototype.diff = function(data) {
	if(this.data === void 0) {
		return;
	}

	return jiff.diff(data, this.data, { hash: defaultHash, makeContext: makeContext });
};

PatchClient.prototype.patch = function(patch) {
	this._patchLocal(patch);
	this._patchBuffer.push(patch);

//	return this._sendNext();
//	return this._send(patch).fold(dispatchReturnPatch, this);
};

PatchClient.prototype._patchLocal = function(patch) {
	if(this.data === void 0) {
		return;
	}

	this.data = jiff.patch(patch, this.data);
};

PatchClient.prototype._handleReturnPatch = function(patch) {
	this._patchBuffer.shift();
	this._patchLocal(rebase(this._patchBuffer, patch));

	return this._sendNext();
};

PatchClient.prototype._fetch = function() {
	return this._queue(this._fetcher);
};

PatchClient.prototype._sendNext = function() {
	// TODO: This delay should be configurable or externalized
	var delay = this._patchBuffer.length === 0 ? 2000 : 500;

	return when(this._patchBuffer).delay(delay)
		.fold(function(self, buf) {
			return self._send(buf[0] || []);
		}, this)
		.fold(dispatchReturnPatch, this);
};

PatchClient.prototype._send = function(msg) {
	return this._queue(this._sender, { method: 'PATCH', entity: msg });
};

function dispatchReturnPatch(to, patch) {
	return to._handleReturnPatch(patch);
}

function getContext(i, array) {
	return {
		before: array.slice(Math.max(0, i-3), i),
		after: array.slice(Math.min(array.length, i), i+3)
	};
}