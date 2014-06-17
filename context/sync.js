var when = require('when');
var Scheduler = require('../data/Scheduler');

module.exports = function sync(builder) {
	return function(context) {
		context.scheduler = new Scheduler();
		var destroy = builder(context);
		return function(context) {
			return when(destroy(context)).tap(shutdown);
			function shutdown() {
				context.scheduler.shutdown();
			}
		};
	};
}