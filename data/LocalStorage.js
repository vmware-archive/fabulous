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

LocalStorage.prototype.get = function() {
	var data = localStorage.getItem(this._namespace);
	if(data == null) {
		var init = this._init;
		return typeof init === 'function' ? init() : init;
	} else {
		return JSON.parse(data);
	}
};

LocalStorage.prototype.set = function(data) {
	localStorage.setItem(this._namespace, JSON.stringify(data));
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
