var makeRoute = require('./route');

module.exports = NavContext;

NavContext.create = function(data) {
	return new NavContext([{ path: '', data: data, route: void 0, routes: [] }]);
};

function NavContext(stack) {
	this.stack = stack;

	var top = stack[stack.length-1];
	this.path = top.path;
	this.data = top.data;
	this.route = top.route;
	this.routes = top.routes;
}

NavContext.prototype.add = function(route, enter, exit) {
	var match = typeof route !== 'function' ? makeRoute(route) : route;
	this.routes.push({ match: match, enter: enter, exit: exit });
	return this;
};

NavContext.prototype.push = function(path) {
	var data, route;
	var match = this.match(path, this.stack);

	if(match !== void 0) {
		route = match.route;
		match.params.push(this.data);
		data = route.enter.apply(void 0, match.params);
	} else {
		data = this.data;
	}

	return new NavContext(this.stack.concat({ path: path, data: data, route: route, routes: [] }));
};

NavContext.prototype.pop = function() {
	if(this.stack.length <= 1) {
		return this;
	}

	var data;
	var route = this.route;
	if(route !== void 0) {
		data = route.exit(this.data);
	} else {
		data = this.data;
	}

	return new NavContext(this.stack.slice(0, -1));
};

NavContext.prototype.match = function(path, stack) {
	var i, j, routes, route, result, s, p;

	p = path;

	for(i=stack.length-1; i>=0; --i) {
		s = stack[i];
		p = s.path ? (s.path + '/' + p) : p;
		routes = s.routes;

		for(j=routes.length-1; j>=0; --j) {
			route = routes[i];
			result = route.match(p);
			if(result) {
				return { params: result, route: route };
			}
		}
	}
};