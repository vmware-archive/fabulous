module.exports = makeLens;
makeLens.property = propertyLens;

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