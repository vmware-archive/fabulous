module.exports = ObservableProvider;

function ObservableProvider(observable) {
	// TODO: Provide a hasChanged flag so observer can know
	// when the data has actually changed
	this.data = void 0;
	var self = this;
	observable.observe(function(data) {
		self.data = data;
	});
}

ObservableProvider.prototype.get = function() {
	return this.data;
};
