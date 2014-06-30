var jiff = require('jiff');
var fn = require('../lib/fn');

module.exports = DSHandler;

function DSHandler(status) {
	if (status == null) {
		status = {};
	}

	this._localVersion = status.localVersion || 1;
	this._remoteVersion = status.remoteVersion || 0;
	this._patchBuffer = status.changes ? status.changes.slice() : [];

	this._timer = void 0;
}

DSHandler.prototype.initConnection = function(connection) {
	if (this._patchBuffer.length === 0) {
		connection.send([{
			localVersion: this._localVersion,
			remoteVersion: this._remoteVersion
		}]);
	} else {
		this._sendPatches(connection);
	}
};

DSHandler.prototype.finishConnection = function(connection) {
	// No-op
};

DSHandler.prototype.addPatches = function(connection, data, patches) {
	var self = this;
	return fn.reduce(function(data, patch) {
		return self._addPatch(connection, data, patch);
	}, data, patches);
};

DSHandler.prototype.receivePatches = function(connection, data, patches) {
	if(this._paused) {
		return;
	}

	var updated = data;

	if(patches.length === 1
		&& !patches[0].patch && patches[0].remoteVersion <= this._localVersion) {
		this._remoteVersion = patches[0].localVersion;
		connection.send([{
			localVersion: this._localVersion,
			remoteVersion: this._remoteVersion,
			patch: [{ op: 'replace', path: '', value: data }]
		}]);
	} else {
		var self = this;
		updated = fn.reduce(function(data, change) {
			// Only apply patches for versions larger than the current
			var updated;
			if(change.localVersion > self._remoteVersion) {
				updated = jiff.patch(change.patch, data);
				self._remoteVersion = change.localVersion;
			} else {
				updated = data;
			}

			return updated
		}, data, patches);

//		console.log('after patch from remote', this._remoteVersion, this.data);
	}

	this._pruneChanges();

	return updated;
};

DSHandler.prototype._addPatch = function(connection, data, patch) {
	var updated = jiff.patch(patch, data);

	this._localVersion += 1;
	var changes = {
		patch: patch,
		localVersion: this._localVersion,
		remoteVersion: this._remoteVersion
	};

	this._patchBuffer.push(changes);
	this._sendPatches(connection);

	return updated;
};

DSHandler.prototype._sendPatches = function(connection) {
	if(this._timer || !connection) {
		return;
	}
	var self = this;
	this._timer = setTimeout(function() {
		self._doSendPatches(connection);
	}, 2000);
};

DSHandler.prototype._doSendPatches = function(connection) {
	this._timer = void 0;

	if(this._paused) {
		return;
	}

	if(this._patchBuffer.length > 0) {
		return connection.send(this._patchBuffer);
	}
};

DSHandler.prototype._pruneChanges = function() {
	// Remove patches the server has acknowledged
	// IOW keep only patches that have a higher remoteVersion
	// than the version the server just told us it has.
	var remoteVersion = this._remoteVersion;
//	console.log('before pruning', this._patchBuffer);
	this._patchBuffer = fn.filter(function (change) {
//		console.log(change.remoteVersion > remoteVersion ? '-->' : '<--', remoteVersion, change.remoteVersion, change);
		return change.remoteVersion > remoteVersion;
	}, this._patchBuffer);
//	console.log('after pruning', this._patchBuffer);
};