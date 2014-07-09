var sync = require('./context/sync');
var scan = require('./context/scan');
var curry = require('./lib/fn').curry;

exports.run = curry(run);

function run(node, builder, context) {
	return sync(scan(node, builder), context);
}