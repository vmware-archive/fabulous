module.exports = function(x) {
	return x != null && x.id !== void 0 ? x.id : JSON.stringify(x);
};