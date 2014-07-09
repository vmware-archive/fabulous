module.exports = PropertyProvider;

function PropertyProvider(key, object) {
	this.key = key;
	this.object = object;
}

PropertyProvider.prototype.get = function() {
	return this.object[this.key];
};

PropertyProvider.prototype.set = function(x) {
	this.object[this.key] = x;
};