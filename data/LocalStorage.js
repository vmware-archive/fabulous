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
	diff: function(data) {
		return jiff.diff(data, this._load(), defaultHash);
	},

	patch: function(patch) {
		this._save(jiff.patch(patch, this._load()));
	},

	_load: function() {
		var data = localStorage.getItem(this._namespace);
		if(data == null) {
			var init = this._init;
			return typeof init === 'function' ? init() : init;
		} else {
			return JSON.parse(data);
		}
	},

	_save: function(data) {
		localStorage.setItem(this._namespace, JSON.stringify(data));
	}
};

function defaultInit() {
	return [];
}
