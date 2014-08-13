module.exports = Lens;

Lens.compose = compose;
Lens.property = propertyLens;
Lens.propertyPath = propertyPathLens;

function Lens(getter, setter) {
	this.get = getter;
	this.set = setter;
}

Lens.prototype.map = function(f, a) {
	return this.set(f(this.get(a)), a);
};

Lens.prototype.compose = function(l2) {
	return compose(this, l2);
};

function propertyLens(k) {
	return new Lens(function(o) {
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
	return new Lens(function(a) {
		return l2.get(l1.get(a));
	}, function(x, a) {
		return l2.set(x, l1.get(a));
	});
}

function nonEmpty(s) {
	return s.length > 0;
}