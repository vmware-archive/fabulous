var when = require('when');
var jiff = require('jiff');
var defaultHash = require('./defaultHash');
var Sync = require('./Sync');
var fn = require('../lib/fn');

module.exports = ProviderClient;

function ProviderClient(provider) {
	this.provider = provider;
}

ProviderClient.prototype.get = function() {
	return this.provider.get();
};

ProviderClient.prototype.set = function(data) {
	return this.provider.set(data);
};

ProviderClient.prototype.diff = function(data) {
	var x = this.provider.get();

	if(when.isPromiseLike(x)) {
		x = valueOf(x);
	}

	return x === void 0 ? void 0 : jiff.diff(data, x, defaultHash);
};

ProviderClient.prototype.patch = function(patch) {
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
