module.exports = WebSocketConnection;

function WebSocketConnection(socket, handler, handleError) {
	this._endpoint = socket;
	this._handleError = handleError;
	this._handler = function(message) {
		handler(JSON.parse(message.data), message);
	};
	this._endpoint.addEventListener('message', this._handler);
	this._endpoint.addEventListener('error', this._handleError);
}

WebSocketConnection.prototype.send = function(data) {
	this._endpoint.send(JSON.stringify(data));
};

WebSocketConnection.prototype.dispose = function() {
	if(typeof this._endpoint.removeEventListener === 'function') {
		this._endpoint.removeEventListener('message', this._handler);
		this._endpoint.removeEventListener('error', this._handleError);
	}
};
