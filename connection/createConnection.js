var WebSocketConnection = require('./WebSocketConnection');
var MessagePortConnection = require('./MessagePortConnection');
var HttpConnection = require('./HttpConnection');

module.exports = function createConnection(endpoint, handler, handleError) {
	if(typeof handleError !== 'function') {
		handleError = defaultErrorHandler;
	}
	if(typeof endpoint.send === 'function') {
		return new WebSocketConnection(endpoint, handler, handleError);
	}

	if(typeof endpoint.postMessage === 'function') {
		return new MessagePortConnection(endpoint, handler, handleError)
	}

	if(typeof endpoint === 'function') {
		return new HttpConnection(endpoint, handler, handleError);
	}
};

function defaultErrorHandler(e) {
	setTimeout(function() { throw e; }, 0);
}
