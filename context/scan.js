var scanner = require('../dom/scanner');

module.exports = function domScan(node, builder, context) {
	var destroy = builder(node, context);
	// TODO: scanner needs to return a new destroy() function
	scanner(node, context);
	return destroy;
};