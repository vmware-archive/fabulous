var jiff = require('jiff');
var when = require('when');

var createConnection = require('./../connection/createConnection');

module.exports = Remote;

function Remote(handler, data) {
	this.data = data == null ? null : jiff.clone(data);
	this._handler = handler;
	this._paused = false;
	this._connection = void 0;
}

Remote.prototype.diff = function(data) {
	return jiff.diff(data, this.data, id);
};

Remote.prototype.patch = function(patch) {
	if(!patch) {
		return;
	}
	this.data = this._handler.addPatches(this._connection, this.data, [patch]);
	this._fireChange(this.data);
};

Remote.prototype.connect = function(endpoint) {
	this._connection = this._createConnection(endpoint);
	this._handler.initConnection(this._connection);
};

Remote.prototype.listen = function(endpoint) {
	this._connection = this._createConnection(endpoint);
};

Remote.prototype._createConnection = function(endpoint) {
	var self = this;
	this.disconnect();
	return createConnection(endpoint, handleMessage);

	function handleMessage(message) {
		self._patchFromRemote(message);
	}
};

Remote.prototype.disconnect = function() {
	if(this._connection !== void 0) {
		this._handler.finishConnection(this._connection);
		// TODO: Better connection dispose strategy
		// The original connection provider (the party that called connect
		// or listen, should probably be responsible for calling dispose
		this._connection.dispose();
		this._connection = void 0;
	}
};

Remote.prototype.pause = function(isPaused) {
	this._paused = isPaused;
	if(!isPaused) {
		this._handler.initConnection(this._connection);
	}
};

Remote.prototype._patchFromRemote = function(patches) {
	if(this._paused) {
		return;
	}

	this.data = this._handler.receivePatches(this._connection, this.data, patches);
	this._fireChange(this.data);
};

Remote.prototype._fireChange = function(x) {
	if(typeof this.onChange === 'function') {
		this.onChange.call(void 0, x);
	}
};

function id(x) {
	return x.id;
}
