var jiff = require('jiff');
var when = require('when');

module.exports = Sync;

function Sync(clients, data) {
	this.clients = clients;
	this._start = 0;
	this.data = data == null ? null : jiff.clone(data);
}

Sync.prototype = {
	add: function(client) {
		this.clients.push(client);
	},

	remove: function(client) {
		this.clients.splice(this.clients.indexOf(client), 1);
	},

	sync: function() {
		var client = this.clients[this._start];
		if(!client) {
			return;
		}

		this._start = nextIndex(this._start, this.clients.length);
		return this._syncClientIndex(client, this._start);
	},

	_syncClientIndex: function(client, start) {
		var patch = client.diff(this.data);
		if(patch && patch.length) {
			try {
				this.data = jiff.patch(patch, this.data);
			} catch(e) {
				console.log(this.data);
				console.log(patch);
				console.error(e);
			}

			var clientsWindow = this.clients.concat(this.clients)
				.slice(start, start + this.clients.length - 1);

			this._patchClients(patch, clientsWindow);
			this._fireChange();
		}
	},

	_patchClients: function(patch, clientsToPatch) {
		return clientsToPatch.map(function(c) {
			return c.patch(patch);
		});
	},

	_fireChange: function() {
		if(typeof this.onChange === 'function') {
			this.onChange.call(void 0, this.data);
		}
	},

	onChange: function(x) {}
};

function nextIndex(i, len) {
	return (i + 1) % len;
}