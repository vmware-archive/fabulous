exports.curry = curry;
exports.compose = compose;
exports.flip = flip;
exports.apply = curry(apply);

exports.identity = identity;

exports.map = curry(map);
exports.ap = curry(ap);
exports.chain = curry(chain);
exports.reduce = curry(reduce);
exports.reduceRight = curry(reduceRight);
exports.filter = curry(filter);
exports.concat = curry(concat);

exports.copyArray = copyArray;

function curry(f, arity) {
	var a = arguments.length > 1 ? arity : f.length;
	return a < 2 ? f : curryArity(f, a, []);
}

function identity(x) {
	return x;
}

function apply(x, f) {
	return f(x);
}

function compose(/*...fs*/) {
	var fs = copyArray(arguments);
	return function(x) {
		reduceRightArrayLike(function(x, f) {
			return f(x);
		}, x, fs);
	};
}

function flip(f) {
	return function(y, x) {
		return f(x, y);
	};
}

function ap(fs, xs) {
	if(fs != null && typeof fs.ap === 'function') {
		return fs.ap(xs);
	}

	return chain(function(f) {
		return map(f, xs)
	}, fs);
}

function map(f, x) {
	if(x != null) {
		if(isArrayLike(x)) {
			return mapArrayLike(f, x);
		}
		if(typeof x.map === 'function') {
			return x.map(f);
		}
	}

	return f(x);
}

function mapArrayLike(f, a) {
	var b = new Array(a.length);
	for(var i=0; i< a.length; ++i) {
		b[i] = f(a[i]);
	}
	return b;
}

function chain(f, x) {
	if(x != null) {
		if(typeof x.chain === 'function') {
			return x.chain(f);
		}
		if(typeof x.then === 'function') {
			return x.then(f);
		}
		if(isArrayLike(x)) {
			return chainArray(f, x);
		}
	}

	throw new TypeError('not chainable ' + x);
}

function chainArray(f, as) {
	return reduce(function(b, a) {
		return concatArray(b, f(a));
	}, [], as);
}

function reduce(f, z, x) {
	if(x != null) {
		if(isArrayLike(x)) {
			return reduceArrayLike(f, z, x);
		}
		if(typeof x.reduce === 'function') {
			return x.reduce(f, z);
		}
	}

	throw new TypeError('not reducible ' + x);
}

function reduceArrayLike(f, z, as) {
	var r = z;
	for(var i=0; i<as.length; ++i) {
		r = f(r, as[i]);
	}
	return r;
}

function reduceRight(f, z, x) {
	if(x != null) {
		if(isArrayLike(x)) {
			return reduceRightArrayLike(f, z, x);
		}
		if(typeof x.reduceRight === 'function') {
			return x.reduceRight(f, z);
		}
	}

	throw new TypeError('not reducible ' + x);
}

function reduceRightArrayLike(f, z, as) {
	var r = z;
	for(var i=as.length-1; i>=0; --i) {
		r = f(r, as[i]);
	}
	return r;
}

function filter(f, x) {
	if(x != null) {
		if(isArrayLike(x)) {
			return filterArrayLike(f, x);
		}
		if(typeof x.filter === 'function') {
			return x.filter(f, x);
		}
	}

	throw new TypeError('not filterable ' + x);
}

function filterArrayLike(f, as) {
	var filtered = [];
	for(var i=0, a; i<as.length; ++i) {
		a = as[i];
		if(f(a)) {
			filtered.push(a);
		}
	}
	return filtered;
}

function concat(a, b) {
	if(a != null) {
		if(isArrayLike(a)) {
			return concatArray(a, b);
		}
		if(typeof a.concat === 'function') {
			return a.concat(b);
		}
	}

	return a + b;
}

function concatArray(a, b) {
	var l = a.length;
	var c = new Array(l + b.length);
	var i;

	for(i=0; i<l; ++i) {
		c[i] = a[i];
	}

	for(i=0; i<b.length; ++i) {
		c[i+l] = b[i];
	}

	return c;
}

function isArrayLike(a) {
	return typeof a === 'object' && typeof a.length === 'number';
}

function copyArray(a) {
	var l = a.length;
	var b = new Array(l);
	for(var i=0; i<l; ++i) {
		b[i] = a[i];
	}
	return b;
}

function curryArity(f, arity, args) {
	return function() {
		var accum = concatArray(args, arguments);

		return accum.length < arity
			? curryArity(f, arity, accum)
			: runCurried(f, accum, this);
	};
}

function runCurried(f, args, thisArg) {
	switch(args.length) {
		// Currying a 0 or 1-arg function would be useless
		case 2: return f.call(thisArg, args[0], args[1]);
		case 3: return f.call(thisArg, args[0], args[1], args[2]);
		case 4: return f.call(thisArg, args[0], args[1], args[2], args[3]);
		case 5: return f.call(thisArg, args[0], args[1], args[2], args[3], args[4]);
		default:
			return f.apply(thisArg, args);
	}
}

