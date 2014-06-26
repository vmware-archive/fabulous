module.exports = makeLens;

makeLens.compose = compose;
makeLens.property = propertyLens;
makeLens.propertyPath = propertyPathLens;

function makeLens(getter, setter) {
	function lensGet(a) {
		return getter(a);
	}

	lensGet.set = setter;
	lensGet.map = function (f, a) {
		return setter(f(getter(a)), a);
	};
	return lensGet;
}

function propertyLens(k) {
	return makeLens(function(o) {
		return o[k];
	}, function(x, o) {
		o[k] = x;
		return o;
	});
}

function propertyPathLens(path) {
	return path.split(/[/.]/).filter(nonEmpty).map(propertyLens).reduce(compose);
}

function compose(l1, l2) {
	return makeLens(function(a) {
		return l2(l1(a));
	}, function(x, a) {
		return l2.set(x, l1(a));
	});
}

function nonEmpty(s) {
	return s.length > 0;
}