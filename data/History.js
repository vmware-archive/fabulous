var jiff = require('jiff');
var defaultHash = require('./defaultHash');
var Zipper = require('../lib/Zipper');

module.exports = History;

function History(zipper) {
	this.zipper = zipper || new Zipper();
}

History.prototype.set = function(data) {
	this.zipper = this.zipper.set(data);
};

History.prototype.get = function() {
	return this.zipper.get();
};

History.prototype.diff = function(data) {
	return jiff.diff(data, this.zipper.get(), defaultHash);
};

History.prototype.patch = function(p) {
	this.zipper = this.zipper.patch(p);
};

History.prototype.prev = function() {
	this.zipper = this.zipper.prev();
};

History.prototype.next = function() {
	this.zipper = this.zipper.next();
};
