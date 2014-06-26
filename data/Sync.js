var jiff = require('jiff');
var most = require('most');

module.exports = Sync;

function Sync(clients, data) {
	this.clients = clients;
	this._updateClientWindow();

	this._start = 0;
	this.data = data == null ? null : jiff.clone(data);

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

		this._start = nextIndex(this._start, this.clients.length);
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
		if(typeof this.onChange === 'function') {
			this.onChange.call(void 0, this.data);
		}
	},

	onChange: void 0 /* function */
};

function nextIndex(i, len) {
	return (i + 1) % len;
}