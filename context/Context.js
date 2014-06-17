module.exports = Context;

function Context(exports, destroy) {
	this.exports = exports;
	this._destroy = destroy;
}

Context.prototype.destroy = function() {
	var destroy = this._destroy;
	if(typeof destroy === 'function') {
		return destroy(this.exports);
	}
};

