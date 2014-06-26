var jiff = require('jiff');
var when = require('when');
var fn = require('../lib.fn');
var applyPatch = fn.flip(jiff.patch);

module.exports = PatchHandler;

function PatchHandler(patches) {
	this._patchBuffer = patches ? patches.slice() : [];
	this._hasData = false;
	this._timer = void 0;
}

PatchHandler.prototype.initConnection = function(connection) {
	connection.send();
};

PatchHandler.prototype.addPatches = function(connection, data, patches) {
	var self = this;
	return fn.reduce(function(data, patch) {
		return self._addPatch(connection, data, patch);
	}, data, patches);
};

PatchHandler.prototype.receivePatches = function(connection, data, patches) {
	if(!this._hasData) {
		this._hasData = true;
		return patches;
	}

	return fn.reduce(applyPatch, data, patches);
};

PatchHandler.prototype._addPatch = function(connection, data, patch) {
	var updated = jiff.patch(patch, data);

	this._patchBuffer.push(patch);
	this._sendPatches(connection);

	return updated;
};

PatchHandler.prototype._sendPatches = function(connection) {
	// TODO: Find a way to externalize the ability to trigger the actual sending
	if(this._timer || !connection) {
		return;
	}
	var self = this;
	this._timer = setTimeout(function() {
		self._doSendPatches(connection);
	}, 1000);
};

PatchHandler.prototype._doSendPatches = function(connection) {
	this._timer = void 0;

	if(this._paused) {
		return;
	}

	this._patchBuffer.forEach(connection.send, connection);
};