var scanner = require('../dom/scanner');
var curry = require('../lib/fn').curry;

module.exports = curry(function domScan(node, builder, context) {
	var destroy = builder(node, context);
	// TODO: scanner needs to return a new destroy() function
	scanner(node, context);
	return destroy;
});