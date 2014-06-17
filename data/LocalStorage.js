var JsonMetadata = require('./metadata/JsonMetadata');

module.exports = LocalStorage;

/**
 * A LocalStorage datasource
 * @constructor
 */
function LocalStorage(namespace, init, identify) {
	this._namespace = namespace || '';
	this._init = init || defaultInit;
	this.metadata = new JsonMetadata(function(x) {
		return x.id;
	});
}

LocalStorage.prototype = {
	diff: function(shadow) {
		return this.metadata.diff(shadow, this._load());
	},

	patch: function(patch) {
		var data = this._load();
		this._save(this.metadata.patch(data, patch));
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
