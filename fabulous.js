var scan = require('./context/scan');
var curry = require('./lib/fn').curry;

exports.run = curry(scanDocument);
exports.runAt = curry(scan);

function scanDocument(builder, context) {
	return scan(document.body, builder, context);
}