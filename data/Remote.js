var jiff = require('jiff');
var when = require('when');

var createConnection = require('./../connection/createConnection');

module.exports = Remote;

function Remote(status) {
	if (status == null) {
		status = {};
	}

	this.data = status.data == null ? null : jiff.clone(status.data);

	this._localVersion = status.localVersion || 1;
	this._remoteVersion = status.remoteVersion || 0;
	this._patchBuffer = status.changes ? status.changes.slice() : [];

	this._paused = false;
	this._connection = void 0;
	this._timer = void 0;
}


Remote.prototype.diff = function(data) {
	return jiff.diff(data, this.data, id);
};

Remote.prototype.patch = function(patch) {
	if(!patch) {
		return;
	}
	return this._addPatch(patch);
};

Remote.prototype.connect = function(endpoint) {
	this.listen(endpoint);
	return this._initClient();
};

Remote.prototype.listen = function(endpoint) {
	this.disconnect();
	this._connection = createConnection(endpoint, handleMessage);

	var self = this;
	function handleMessage(message) {
		self._patchFromRemote(message);
	}
};

Remote.prototype.disconnect = function() {
	if(this._connection !== void 0) {
		this._connection.dispose();
	}
};

Remote.prototype._initClient = function() {
	if (this._patchBuffer.length === 0) {
		this._connection.send([{
			localVersion: this._localVersion,
			remoteVersion: this._remoteVersion
		}]);
	} else {
		this._sendChanges();
	}
};

Remote.prototype._addPatch = function(patch) {
	this.data = jiff.patch(jiff.clone(patch), this.data);

	this._localVersion += 1;
	var changes = {
		patch: patch,
		localVersion: this._localVersion,
		remoteVersion: this._remoteVersion
	};

	this._patchBuffer.push(changes);

	this._fireChange(this.data);

	return this._sendChanges();
};

Remote.prototype.pause = function(isPaused) {
	this._paused = isPaused;
	if(!isPaused) {
		this._initClient();
	}
};

Remote.prototype._sendChanges = function() {
	if(this._timer) {
		return;
	}
	var self = this;
	this._timer = setTimeout(function() {
		self._doSendChanges();
	}, 1000);
};

Remote.prototype._doSendChanges = function() {
	this._timer = void 0;

	if(this._paused) {
		return;
	}

	if(this._patchBuffer.length > 0) {
		return this._connection.send(this._patchBuffer);
	}
};

Remote.prototype._patchFromRemote = function(patches) {
	if(this._paused) {
		return;
	}

	console.log('received', this._remoteVersion, patches);
	if(patches.length === 1
		&& !patches[0].patch && patches[0].remoteVersion <= this._localVersion) {
		this._remoteVersion = patches[0].localVersion;
		this._connection.send([{
			localVersion: this._localVersion,
			remoteVersion: this._remoteVersion,
			patch: [{ op: 'replace', path: '', value: this.data }]
		}]);
	} else {
		patches.forEach(function(change) {
//			console.log(this._remoteVersion, change);
			// Only apply patches for versions larger than the current
			if(change.localVersion > this._remoteVersion) {
//				console.log('+++', this._remoteVersion, change);
				this.data = jiff.patch(change.patch, this.data);
				this._remoteVersion = change.localVersion;
			} else {
//				console.log('---', this._remoteVersion, change);
			}
		}, this);

//		console.log('after patch from remote', this._remoteVersion, this.data);
	}

	this._pruneChanges();
	this._fireChange(this.data);
};

Remote.prototype._fireChange = function(x) {
	if(typeof this.onChange === 'function') {
		this.onChange.call(void 0, x);
	}
};

Remote.prototype._pruneChanges = function() {
	// Remove patches the server has acknowledged
	// IOW keep only patches that have a higher remoteVersion
	// than the version the server just told us it has.
	var remoteVersion = this._remoteVersion;
	console.log('before pruning', this._patchBuffer);
	this._patchBuffer = this._patchBuffer.filter(function (change) {
		console.log(change.remoteVersion > remoteVersion ? '-->' : '<--', remoteVersion, change.remoteVersion, change);
		return change.remoteVersion > remoteVersion;
	});
	console.log('after pruning', this._patchBuffer);
};

function id(x) {
	return x.id;
}
