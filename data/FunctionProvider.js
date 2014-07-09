module.exports = FunctionProvider;

function FunctionProvider(f, context) {
	this.f = f;
	this.context = context;
}

FunctionProvider.prototype.get = function() {
	return this.f.call(this.context);
};
