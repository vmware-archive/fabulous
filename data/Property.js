var jiff = require('jiff');
var jsonPointer = require('jiff/lib/jsonPointer');
var when = require('when');

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
		val = i.state === 'fulfilled' ? i.value : void 0;
	}

	return val === void 0 ? void 0 : jiff.diff(data, val, id);
};

Property.prototype.patch = function(patch) {
	if(patch.length === 0) {
		return;
	}

	var p = jsonPointer.find(this.object, this.path)
	var data = jiff.patch(patch, p.target[p.key]);
	p.target[p.key] = data;

	if(typeof this.onChange === 'function') {
		this.onChange.call(void 0, data);
	}
};

// TODO: Need something better than just a single method
// 1) stream?
Property.prototype.onChange = function() {};

// FIXME: Not a good general default
function id(x) {
	return x.id;
}
