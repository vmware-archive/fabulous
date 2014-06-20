var when = require('when');
var jiff = require('jiff');
var jsonPointer = require('jiff/lib/jsonPointer');
var defaultHash = require('./defaultHash');

module.exports = Property;

function Property(object, path) {
	this.object = object;
	this.path = path;
}

// TODO: What if property is a function?

Property.prototype.diff = function(data) {
	var p = jsonPointer.find(this.object, this.path);
	var x = p.target[p.key];

	if(when.isPromiseLike(x)) {
		x = valueOf(x);
	}

	return x === void 0 ? void 0 : jiff.diff(data, x, defaultHash);
};

Property.prototype.patch = function(patch) {
	if(patch.length === 0) {
		return;
	}

	var p = jsonPointer.find(this.object, this.path);
	var x = p.target[p.key];
	var onChange = this.onChange;
	var patched;

	if(when.isPromiseLike(x)) {
		// Promise. allow it to remain a promise, ie don't
		// overwrite with a non-promise value
		patched = p.target[p.key] = when(x, function(x) {
			return jiff.patch(patch, x);
		});
	} else {
		// Non-promise
		patched = p.target[p.key] = jiff.patch(patch, x);
	}

	// Always fire async
	when(patched, onChange);
};

// TODO: Need something better than just a single method
// 1) stream?
Property.prototype.onChange = function() {};

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
