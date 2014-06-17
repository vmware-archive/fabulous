var Context = require('./Context');
var when = require('when');

module.exports = function buildContext(builder, parent) {
	var exports = Object.create(parent != null ? parent.exports : null);

	return when(builder(exports), function(destroy) {
		var child = new Context(exports, destroy);
		if(parent) {
			parent.destroy = function() {
				return when(child.destroy()).with(this).then(this.destroy);
			};
		}
		return child;
	});
};
