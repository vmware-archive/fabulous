var jiff = require('jiff');
var defaultHash = require('./defaultHash');

module.exports = LocalStorage;

/**
 * A LocalStorage datasource
 * @constructor
 */
function LocalStorage(namespace, init) {
	this._namespace = namespace || '';
	this._init = init || defaultInit;
}

LocalStorage.prototype = {
	diff: function(shadow) {
		return jiff.diff(shadow, this._load(), defaultHash);
	},

	patch: function(patch) {
		this._save(jiff.patch(patch, this._load()));
	},

	_load: function() {
		var data = localStorage.getItem(this._namespace);
		if(data == null) {
			data = typeof this._init === 'function'
				? this._init.call(void 0)
				: this._init;
		} else {
			data = JSON.parse(data);
		}

		return data;
	},

	_save: function(data) {
		localStorage.setItem(this._namespace, JSON.stringify(data));
	}
};

function defaultInit() {
	return [];
}
