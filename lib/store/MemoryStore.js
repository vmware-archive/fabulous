module.exports = MemoryStore;

function MemoryStore(data) {
	this.data = data;
}

MemoryStore.prototype.get = function() {
	return this.data;
};

MemoryStore.prototype.set = function(data) {
	this.data = data;
	return this;
};