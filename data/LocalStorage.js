var jiff = require('jiff');
var defaultHash = require('./defaultHash');
var LocalStorageStore = require('../lib/store/LocalStorageStore');

module.exports = LocalStorage;

/**
 * A LocalStorage datasource
 * @constructor
 */
function LocalStorage(namespace, init) {
	this.store = new LocalStorageStore(namespace);
	this._init = init || defaultInit;
}

LocalStorage.prototype.get = function() {
	var data = this.store.get();
	if(data == null) {
		var init = this._init;
		return typeof init === 'function' ? init() : init;
	}

	return data;
};

LocalStorage.prototype.set = function(data) {
	this.store = this.store.set(data);
};

LocalStorage.prototype.diff = function(data) {
	return jiff.diff(data, this.get(), defaultHash);
};

LocalStorage.prototype.patch = function(patch) {
	this.set(jiff.patch(patch, this.get()));
};

function defaultInit() {
	return [];
}
