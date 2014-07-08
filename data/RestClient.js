var when = require('when');
var jiff = require('jiff');
var rebase = require('jiff/lib/rebase');

var defaultHash = require('./defaultHash');
var fn = require('../lib/fn');
var path = require('../lib/path');

module.exports = RestClient;

function RestClient(client) {
	this._client = client;
	this.data = void 0;

	this._patchBuffer = [];
}

RestClient.prototype.get = function() {
	var self = this;
	return this._client().then(function(data) {
		self.data = fn.reduce(function(data, patch) {
			return jiff.patch(patch, data);
		}, data, self._patchBuffer);

		return jiff.clone(data);
	});
};

RestClient.prototype.set = function() {
	// TODO: Should we allow this?  Seems safe enough
	// Problem case: might get clobbered by inflight fetch() result
	throw new Error('setting data not allowed');
};

RestClient.prototype.diff = function(data) {
	if(this.data === void 0) {
		return;
	}

	return jiff.diff(data, this.data, defaultHash);
};

RestClient.prototype.patch = function(patch) {
	this._patchLocal(patch);
	this._patchBuffer.push(patch);

	return this._send(patch).fold(dispatchReturnPatch, this);
};

RestClient.prototype._patchLocal = function(patch) {
	if(this.data === void 0) {
		return;
	}

	this.data = jiff.patch(patch, this.data);
};

RestClient.prototype._handleReturnPatch = function(patch) {
	this._patchBuffer.shift();
	return this._patchLocal(rebase(this._patchBuffer, patch));
};

RestClient.prototype._send = function() {
	var client = this._client;
	var buffer = this._patchBuffer;
	this._patchBuffer = [];

	return fn.reduce(function(p, patch) {
		for(var i=0; i<patch.length; ++i) {
			p = sendNext(p, client, patch[i], patch[i-1]);
		}
		return p;
	}, when(), buffer);
};

function sendNext(p, client, operation, previous) {
	return when(p, function() {
		return send(client, operation, previous);
	});
}

function dispatchReturnPatch(to, patch) {
	return to._handleReturnPatch(patch);
}

function send(client, operation, previous) {
	var key = path.split(operation.path)[0];
	if(!key) {
		return;
	}

	if(operation.op === 'add') {
		return client({
			method: 'POST',
			entity: operation.value
		});
	}

	if(operation.op === 'remove') {
		return client({
			method: 'DELETE',
			path: ''+previous.value.id
		});
	}

	if(operation.op === 'replace') {
		return client({
			method: 'PUT',
			entity: operation.value,
			path: ''+operation.value.id
		});
	}
}