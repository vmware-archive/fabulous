module.exports = compile;

function compile(x) {
	return typeof x instanceof RegExp
		? compileRegExp(x)
		: compileString(String(x));
}

function compileRegExp(routeRegExp) {
	return function(path) {
		var match = routeRegExp.exec(path);
		return match != null && match.slice(1);
	}
}

function compileString(routeString) {
	var ra = routeString.split('/');
	var segments = ra.reduce(parseSegment, new Array(ra.length));
	return compileRegExp(new RegExp('^' + segments.join('/') + '$'));
}

function parseSegment(segments, s, i) {
	segments[i]
		= s === '**'   ? '.+?'
		: s === '*'    ? '[^/]+'
		: s[0] === ':' ? '([^/]+)'
		: s;

	return segments;
}