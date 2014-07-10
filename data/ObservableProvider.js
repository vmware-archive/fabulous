module.exports = ObservableProvider;

function ObservableProvider(observable) {
	this.data = void 0;
	observable.reduce(function(self, data) {
		self.data = data;
		return self;
	}, this);
}

ObservableProvider.prototype.get = function() {
	return this.data;
};
