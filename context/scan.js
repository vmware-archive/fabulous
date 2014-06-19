var scanner = require('../dom/scanner');
var curry = require('../lib/fn').curry;

module.exports = curry(function domScan(node, builder, context) {
	var destroy = builder(context);
	scanner(node, context);
	return destroy;
});