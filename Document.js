var when = require('when');

var ProviderClient = require('./data/ProviderClient');
var ReadOnlyProviderClient = require('./data/ReadOnlyProviderClient');
var PropertyProvider = require('./data/PropertyProvider');
var FunctionProvider = require('./data/FunctionProvider');
var ObservableProvider = require('./data/ObservableProvider');

var PatchClient = require('./data/PatchClient');

var Sync = require('./data/Sync');
var fn = require('./lib/fn');

exports.fromProperty = fn.curry(fromProperty);
exports.fromFunction = fromFunction;
exports.fromObservable = fromObservable;
exports.fromPatchRemote = fromPatchRemote;

exports.sync = fn.curry(sync);

function fromProperty(key, objectOrArray) {
	return new ProviderClient(new PropertyProvider(key, objectOrArray));
}

function fromFunction(f, thisArg) {
	return new ReadOnlyProviderClient(new FunctionProvider(f, thisArg));
}

function fromObservable(observable) {
	return new ReadOnlyProviderClient(new ObservableProvider(observable));
}

function sync(documents, scheduler) {
	return new Sync(documents).run(scheduler);
}

function fromPatchRemote(send, data) {
	return new PatchClient(send, data);
}