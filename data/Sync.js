var jiff = require('jiff');
var when = require('when');

var fn = require('../lib/fn');

module.exports = Sync;

function Sync(clients) {
	this.clients = clients;

	this._clientWindow = void 0;
	this._start = 0;
	this.data = void 0;

	var self = this;
	this._runSync = function() {
		return self.sync();
	}
}

Sync.prototype = {
	add: function(client) {
		this.clients.push(client);
		this._updateClientWindow();

		if(this.data !== void 0) {
			client.set(this.data);
		}
	},

	remove: function(client) {
		this.clients.splice(this.clients.indexOf(client), 1);
		this._updateClientWindow();
	},

	_updateClientWindow: function() {
		this._clientWindow = this.clients.concat(this.clients);
	},

	_init: function() {
		return getData(0, this.clients);
	},

	run: function(signal) {
		this._updateClientWindow();

		var self = this;
		return when(this._init())
			.fold(initClients, this.clients)
			.then(function(data) {
				self.data = data == null ? null : jiff.clone(data);
				return self._fireChange();
			})
			.then(function() {
				signal.observe(self._runSync);
			});
	},

	stop: function() {
		// TODO: return End to signal
		this._running = false;
	},

	sync: function() {
		var client = this.clients[this._start];
		if(!client) {
			return;
		}

		var len = this.clients.length;
		this._start = (this._start + 1) % len;
		this._syncClientIndex(client, this._start);
	},

	_syncClientIndex: function(client, start) {
		var patch = client.diff(this.data);
		if(patch && patch.length > 0) {
			this.data = jiff.patch(patch, this.data);
			this._patchClients(patch, start);
			this._fireChange();
		}
	},

	_patchClients: function(patch, start) {
		var end = start + this.clients.length - 1;
		var clientsToPatch = this._clientWindow;

		for(var i=start; i<end; ++i) {
			clientsToPatch[i].patch(patch);
		}
	},

	_fireChange: function() {
		// TODO: This should be an observable
		var onChange = this.onChange;
		if(typeof onChange === 'function') {
			onChange(this.data);
		}
	},

	onChange: void 0 /* function */
};

function getData(i, clients) {
	var client = clients[i];
	return when(client.get(), function(data) {
		return { data: data, client: client };
	}).catch(function(e) {
		if(i < clients.length-1) {
			return getData(i+1, clients);
		}

		throw e;
	});
}

function initClients(clients, source) {
	var c = fn.filter(function(c) {
		return c !== source.client;
	}, clients);

	return fn.reduce(function(data, client) {
		client.set(data);
		return data;
	}, source.data, c);
}