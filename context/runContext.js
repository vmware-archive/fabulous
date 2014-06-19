var curry = require('../lib/fn').curry;

module.exports = curry(function(builder, parent) {
	return builder(Object.create(parent || null));
});
