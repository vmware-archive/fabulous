var when = require('when');
var jiff = require('jiff');
var jsonPointer = require('jiff/lib/jsonPointer');

module.exports = Property;

function Property(object, path) {
	this.object = object;
	this.path = path;
}

// TODO: What if property is a function?

Property.prototype.diff = function(data) {
	var p = jsonPointer.find(this.object, this.path);
	var val = p.target[p.key];

	if(when.isPromiseLike(val)) {
		var i = when(val).inspect();
		if(i.state === 'pending') {
			return;
		}

		if(i.state === 'fulfilled') {
			val = i.value;
		} else {
			throw i.reason;
		}
	}

	return val === void 0 ? void 0 : jiff.diff(data, val, id);
};

Property.prototype.patch = function(patch) {
	if(patch.length === 0) {
		return;
	}

	var p = jsonPointer.find(this.object, this.path);
	var val = p.target[p.key];
	var onChange = this.onChange;

	if(when.isPromiseLike(val)) {
		// Promise. allow it to remain a promise, ie don't
		// overwrite with a non-promise value
		p.target[p.key] = when(val, function(val) {
			var data = jiff.patch(patch, val);

			if(typeof onChange === 'function') {
				onChange(data);
			}

			return data;
		});
	} else {
		// Non-promise
		var data = jiff.patch(patch, val);
		p.target[p.key] = data;

		if(typeof onChange === 'function') {
			onChange(data);
		}
	}
};

// TODO: Need something better than just a single method
// 1) stream?
Property.prototype.onChange = function() {};

// FIXME: Not a good general default
function id(x) {
	return x.id;
}
