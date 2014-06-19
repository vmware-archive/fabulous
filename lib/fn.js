exports.curry = curry;
exports.compose = compose;
exports.flip = flip;

exports.identity = identity;

exports.map = curry(map);
exports.ap = curry(ap);
exports.chain = curry(chain);
exports.reduce = curry(reduce);
exports.reduceRight = curry(reduceRight);
exports.concat = curry(concat);

function curry(f, arity) {
	var a = arguments.length > 1 ? a : f.length;
	return a < 2 ? f : curryArity(f, a, []);
}

function curryArity(f, arity, args) {
	return function() {
		var accum = concatArray(args, arguments);

		return accum.length < arity
			? curryArity(f, arity, accum)
			: apply(f, accum, this);
	};
}

function apply(f, args, thisArg) {
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

function identity(x) {
	return x;
}

function compose(/*...fs*/) {
	var fs = slice(arguments);
	return function(x) {
		return fs.reduceRight(function(x, f) {
			return f(x);
		}, x);
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
		if(typeof x.map === 'function') {
			return x.map(f);
		}
		if(isArrayLike(x)) {
			return mapArray(f, x);
		}
	}

	return f(x);
}

function mapArray(f, a) {
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

function chainArray(f, a) {
	return reduce(function(b, x) {
		return concatArray(b, f(x));
	}, [], a);
}

function reduce(f, z, x) {
	if(x != null) {
		if(typeof x.reduce === 'function') {
			return x.reduce(f, z);
		}
		if(isArrayLike(x)) {
			return reduceArray(f, z, x);
		}
	}

	throw new TypeError('not reducible ' + x);
}

function reduceArray(f, z, a) {
	var r = z;
	for(var i=0; i<a.length; ++i) {
		r = f(r, a[i]);
	}
	return r;
}

function reduceRight(f, z, x) {
	if(x != null) {
		if(typeof x.reduceRight === 'function') {
			return x.reduceRight(f, z);
		}

		if(isArrayLike(x)) {
			return reduceRightArray(f, z, x);
		}
	}

	throw new TypeError('not reducible ' + x);
}

function reduceRightArray(f, z, a) {
	var r = z;
	for(var i=a.length-1; i>=0; --i) {
		r = f(r, a[i]);
	}
	return r;
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

function slice(a) {
	var b = new Array(a.length);
	for(var i=0; i<a.length; ++i) {
		b[i] = a[i];
	}
	return b;
}
