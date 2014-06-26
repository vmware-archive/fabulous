var when = require('when');
var jiff = require('jiff');
var defaultHash = require('./defaultHash');

module.exports = Observer;

Observer.fromProperty = function(key, object) {
	return new Observer(new PropertyProvider(key, object));
};

Observer.fromFunction = function(f, context) {
	return new FunctionObserver(f, context);
};

Observer.fromStream = function(stream) {
	return new StreamObserver(stream);
};

function Observer(provider) {
	this.provider = provider;
}

Observer.prototype.diff = function(data) {
	var x = this.provider.get();

	if(when.isPromiseLike(x)) {
		x = valueOf(x);
	}

	return x === void 0 ? void 0 : jiff.diff(data, x, defaultHash);
};

Observer.prototype.patch = function(patch) {
	if(patch.length === 0) {
		return;
	}

	var x = this.provider.get();

	if(x === void 0) {
		return;
	}

	if(when.isPromiseLike(x)) {
		// Promise. allow it to remain a promise, ie don't
		// overwrite with a non-promise value
		this.provider.set(when(x, function(x) {
			return jiff.patch(patch, x);
		}));
	} else {
		// Non-promise
		this.provider.set(jiff.patch(patch, x));
	}
};

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

function FunctionObserver(f, context) {
	Observer.call(this, new FunctionProvider(f, context));
}

FunctionObserver.prototype = Object.create(Observer.prototype);

FunctionObserver.prototype.patch = function() {
	// Read-only
};

function FunctionProvider(f, context) {
	this.f = f;
	this.context = context;
}

FunctionProvider.prototype.get = function() {
	return this.f.call(this.context);
};

function StreamObserver(stream) {
	Observer.call(this, new StreamProvider(stream));
}

StreamObserver.prototype = Object.create(Observer.prototype);

StreamObserver.prototype.patch = function() {
	// Read-only
};

function StreamProvider(stream) {
	this.data = void 0;
	stream.reduce(function(self, data) {
		self.data = data;
		return self;
	}, this);
}

StreamProvider.prototype.get = function() {
	return this.data;
};

function valueOf(promise) {
	var i = when(promise).inspect();
	if(i.state === 'pending') {
		return;
	}

	if(i.state === 'fulfilled') {
		return i.value;
	} else {
		throw i.reason;
	}
}
