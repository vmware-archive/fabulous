var fn = require('./fn');
var paths = require('./path');

exports.find = fn.curry(find);

function find(path, object) {
	var keys = paths.split(path);
	var last = keys.length-1;

	var target = object;
	for(var i=0; i<last; ++i) {
		target = target[keys[i]];
		if(target == null) {
			return { target: target, key: void 0 };
		}
	}

	return { target: target, key: keys[last] };
}
