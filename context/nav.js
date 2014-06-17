var NavContext = require('../nav/NavContext');
var transition = require('../nav/transition');

module.exports = function nav(builder) {
	return function(context) {
		// TODO: Should have to create this. It should be provided
		// ie context.navigation or something
		context.navigation = NavContext.create();

		var destroy = builder(context);

		// TODO: This startup should happen in some framework initialization/setup
		// module or the base application context, etc.
		context.navigation = navigate(location.hash.slice(1), '', context.navigation);
		window.addEventListener('hashchange', handleNavChange);

		return function(context) {
			window.removeEventListener('hashchange', handleNavChange)
			destroy(context);
		};

		function handleNavChange(e) {
			context.navigation = navigate(e.newURL.split('#')[1],
				e.oldURL.split('#')[1], context.navigation);
		}
	}
};

// TODO: These should be moved to what/nav/something
function navigate(to, from, s) {
	return transition(push, pop, parsePath(to), parsePath(from), s)
}

function parsePath(p) {
	return p ? p.split('/') : [];
}

function push(nav, s) {
//	console.log('push', s);
	return nav.push(s);
}

function pop(nav, s) {
//	console.log('pop', s);
	return nav.pop();
}