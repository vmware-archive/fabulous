var jiff = require('jiff');
var defaultHash = require('./defaultHash');

module.exports = History;

function History(zipper) {
	this.zipper = zipper;
}

History.prototype.diff = function(data) {
	return jiff.diff(data, this.zipper.data, defaultHash);
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
