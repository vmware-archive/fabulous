var reduce = Array.prototype.reduce;

module.exports = parse;

function parse(parsers, node) {
	return reduce.call(node.children, function(parsers, node) {
		return parse(parsers.map(runParser, node), node);
	}, parsers);
}

function runParser(parser) {
	parser.state = parser.parse(this, parser.state);
	return parser;
}
