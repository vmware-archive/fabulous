var when = require('when');

module.exports = HttpConnection;

function HttpConnection(send, handler, handleError) {
	this._send = send;
	this._queue = when();
	this._handler = handler;
	this._handleError = handleError;
}

HttpConnection.prototype.send = function(data) {
	var send = this._send;
	this._queue = this._queue.then(function() {
		return send(data);
	}).then(this._handler).catch(this._handleError);
};

HttpConnection.prototype.dispose = function() {
	this._send = this._handler = this._handleError = void 0;
};
