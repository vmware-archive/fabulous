var jiff = require('jiff');
var commuteRtL = require('jiff/lib/commute').rtl;

var patch = jiff.patch;
var inverse = jiff.inverse;

module.exports = Zipper;

function Zipper(data, before, after) {
	this.data = data || null;
	this.before = before || [];
	this.after = after || [];
}

Zipper.prototype.patch = function(p) {
	return new Zipper(patch(p, this.data),
		this.before.concat([p]),
		this.after.map(function(laterPatch) { return rebaseOne(p, laterPatch); }));
};

Zipper.prototype.prev = function() {
	if(this.before.length === 0) {
		return this;
	}

	var p = this.before[this.before.length-1];
	return new Zipper(patch(inverse(p), this.data),
		this.before.slice(0, -1), this.after.concat([p]));
};

Zipper.prototype.next = function() {
	if(this.after.length === 0) {
		return this;
	}

	var p = this.after[this.after.length-1];
	return new Zipper(patch(p, this.data),
		this.before.concat([p]), this.after.slice(0, -1));
};

function rebaseOne(base, p) {
	return commuteRtL(inverse(base), p);
}
