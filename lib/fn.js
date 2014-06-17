var slice = Array.prototype.slice;
var arrayMap = Array.prototype.map;

exports.curry = curry;
exports.identity = identity;
exports.compose = compose;
exports.map = curry(map);
exports.ap = curry(ap);
exports.chain = curry(chain);

function curry(f /*, arity */) {
	return curryArity(f, arguments.length > 1 ? arguments[1] : f.length, []);
}

function curryArity(fn, arity, args) {
	return function() {
		var accumulated = args.concat(slice.call(arguments));

		return accumulated.length < arity
			? curryArity(fn, arity, accumulated)
			: fn.apply(this, accumulated);
	};
}

function identity(x) {
	return x;
}

function compose(/*...fs*/) {
	var fs = Array.prototype.slice.call(arguments);
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
	return chain(function(f) {
		return map(f, xs)
	}, fs);
}

function map(f, x) {
	if(x != null) {
		if(typeof x.map === 'function') {
			return x.map(f);
		}
		if(typeof x === 'object' && typeof x.length === 'number') {
			return arrayMap.call(x, f);
		}
	}

	return f(x);
}

function chain(f, x) {
	if(Array.isArray(x)) {
		return chainArray(f, x);
	}

	if(x != null) {
		if(typeof x.chain === 'function') {
			return x.chain(f);
		}
		if(typeof x.then === 'function') {
			return x.then(f);
		}
	}

	throw new TypeError('not chainable', x);
}

function chainArray(f, a) {
	return a.reduce(function(b, x) {
		return b.concat(f(x));
	}, []);
}
