var when = require('when');

module.exports = transition;

function transition(push, pop, to, from, state) {
	var start = findCommonPrefix(to, from);

	var i;
	for(i = from.length-1; i >= start; --i) {
		state = pop(state, from[i]);
	}

	for(i = start; i < to.length; ++i) {
		state = push(state, to[i]);
	}

	return state;
}

function findCommonPrefix(a, b) {
	var i = 0;

	while(i < a.length && i < b.length && a[i] === b[i]) {
		++i;
	}

	return i;
}
