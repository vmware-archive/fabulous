var sync = require('./context/sync');
var scan = require('./context/scan');
var nav = require('./context/nav');
var curry = require('./lib/fn').curry;

exports.run = curry(run);

function run(node, builder, context) {
	return nav(sync(scan(node, builder)), context);
}