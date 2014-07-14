var when = require('when');
var Scheduler = require('../lib/Scheduler');
var runContext = require('./runContext');
var curry = require('../lib/fn').curry;

module.exports = curry(function sync(builder, context) {
	context.scheduler = new Scheduler();

	var destroy = runContext(builder, context);

	return function(context) {
		return when(destroy(context)).tap(shutdown);
		function shutdown() {
			context.scheduler.shutdown();
		}
	};
});