module.exports = ObservableSource;

function ObservableSource(observable) {
	this.data = void 0;
	observable.reduce(function(self, data) {
		self.data = data;
		return self;
	}, this);
}

ObservableSource.prototype.get = function() {
	return this.data;
};
