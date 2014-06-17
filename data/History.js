var jiff = require('jiff');

module.exports = History;

function History(zipper) {
	this.zipper = zipper;
}

History.prototype.diff = function(data) {
	return jiff.diff(data, this.zipper.data, function id(x) {
		return x.id;
	});
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
