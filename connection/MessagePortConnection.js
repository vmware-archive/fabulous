module.exports = MessagePortConnection;

function MessagePortConnection(port, handler, handleError) {
	this._endpoint = port;
	this._handleError = handleError;
	this._handler = function(message) {
		handler(JSON.parse(message), message);
	};
	this._endpoint.addEventListener('message', this._handler);
}

MessagePortConnection.prototype.send = function(data) {
	this._endpoint.postMessage(JSON.stringify(data));
};

MessagePortConnection.prototype.dispose = function() {
	this._endpoint.removeEventListener('message', this._handler);
};
