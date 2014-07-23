module.exports = PropertySource;

function PropertySource(key, object) {
	this.key = key;
	this.object = object;
}

PropertySource.prototype.get = function() {
	return this.object[this.key];
};

PropertySource.prototype.set = function(x) {
	this.object[this.key] = x;
};