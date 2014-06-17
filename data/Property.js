var jiff = require('jiff');
var jsonPointer = require('jiff/lib/jsonPointer');

module.exports = Property;

function Property(object, path) {
	this.object = object;
	this.path = path;
}

Property.prototype.diff = function(data) {
	var p = jsonPointer.find(this.object, this.path);
	return jiff.diff(data, p.target[p.key], id);
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

Property.prototype.onChange = function() {};

function id(x) {
	return x.id;
}
