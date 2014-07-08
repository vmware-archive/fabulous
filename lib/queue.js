var when = require('when');

module.exports = function() {
	var q = void 0;
	return function(task, x) {
		var result = when(q).fold(function(x) {
			return task(x);
		}, x);

		q = result.else();

		return result;
	};
};