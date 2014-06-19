var most = require('most');

var runContext = require('./runContext');
var path = require('../lib/path');
var transition = require('../nav/transition');
var curry = require('../lib/fn').curry;

module.exports = curry(function nav(builder, context) {
	context.navigation = most(function (emit) {
		var current = location.hash.slice(1);

		var state = navigate(current, '', []);

		window.addEventListener('hashchange', handleNavChange);

		function handleNavChange (e) {
			var prev = e.oldURL.split('#')[1];
			var next = e.newURL.split('#')[1];
			state = navigate(next, prev, state);
		}

		function navigate (to, from, state) {
			return transition(push, pop, path.split(to), path.split(from), state);
		}

		function push (state, path) {
			state = state.concat(path);
			emit({ action: 1, stack: state, path: state.join('/') });
			return state;
		}

		function pop (state) {
			emit({ action: -1, stack: state, path: state.join('/') });
			return state.slice(0, -1);
		}
	});

	return runContext(builder, context);
});
