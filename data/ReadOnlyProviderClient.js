var ProviderClient = require('./ProviderClient');

module.exports = ReadOnlyProviderClient;

function ReadOnlyProviderClient(provider) {
	ProviderClient.call(this, provider);
}

ReadOnlyProviderClient.prototype = Object.create(ProviderClient.prototype);

ReadOnlyProviderClient.prototype.patch = function() {
	// Read-only
};

ReadOnlyProviderClient.prototype.set = function() {
	// Read-only
};