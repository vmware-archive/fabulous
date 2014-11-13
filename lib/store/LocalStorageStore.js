module.exports = LocalStorageStore;

function LocalStorageStore(localStorage, key, data) {
	this.localStorage = localStorage;
	this.key = key;
	this.data = data;
}

LocalStorageStore.create = function(key, data) {
	return new LocalStorageStore(localStorage, key, data);
};

LocalStorageStore.prototype.get = function() {
	if(this.data === void 0) {
		var data = this.data = this.localStorage.getItem(this.key);
		return data == null ? data : JSON.parse(data);
	}

	return this.data;
};

LocalStorageStore.prototype.set = function(data) {
	this.localStorage.setItem(this.key, JSON.stringify(data));
	this.data = data;
	return this;
};
