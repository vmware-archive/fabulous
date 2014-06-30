var jiff = require('jiff');
var most = require('most');

var defaultPeriod = 20;

module.exports = Sync;

function Sync(clients, period) {
	this.clients = clients;
	this._updateClientWindow();

	this._start = 0;
	this._period = period || defaultPeriod;
	this.data = null;

	var self = this;
	this.changes = most(function(emit) {
		self.onChange = emit;
	});
}

Sync.prototype = {
	add: function(client) {
		this.clients.push(client);
		this._updateClientWindow();
	},

	remove: function(client) {
		this.clients.splice(this.clients.indexOf(client), 1);
		this._updateClientWindow();
	},

	_updateClientWindow: function() {
		this._clientWindow = this.clients.concat(this.clients);
	},

	sync: function() {
		var client = this.clients[this._start];
		if(!client) {
			return;
		}

		this._start = (this._start + 1) % this.clients.length;
		this._syncClientIndex(client, this._start);

		return this._period;
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
		var onChange = this.onChange;
		if(typeof onChange === 'function') {
			onChange(this.data);
		}
	},

	onChange: void 0 /* function */
};
