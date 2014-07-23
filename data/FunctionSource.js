module.exports = FunctionSource;

function FunctionSource(f, context) {
	this.f = f;
	this.context = context;
}

FunctionSource.prototype.get = function() {
	return this.f.call(this.context);
};
