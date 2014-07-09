var Stream = require('./lib/Stream');

exports.of = Stream.of;

exports.from = Stream.from;

exports.fromPromise = Stream.fromPromise;

exports.fromEvent = function(event, source) {
	if(typeof source.addEventListener === 'function') {
		return Stream.produce(function(put) {
			source.addEventListener(event, put, false);
		});
	} else if(typeof source.on === 'function') {
		return Stream.produce(function(put) {
			source.on(event, put);
		});
	}

	throw new TypeError('source must support either .addEventListener or .on: ' + source);
};
