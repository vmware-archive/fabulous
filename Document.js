var when = require('when');
var most = require('most');

var ProviderClient = require('./data/ProviderClient');
var ReadOnlyProviderClient = require('./data/ReadOnlyProviderClient');
var PropertySource = require('./data/PropertySource');
var FunctionSource = require('./data/FunctionSource');
var ObservableSource = require('./data/ObservableSource');

var PatchClient = require('./data/PatchClient');

var Sync = require('./data/Sync');
var fn = require('./lib/fn');

var defaultSyncSignal = most.periodic(20);

exports.fromSource = fromSource;
exports.fromProperty = fn.curry(fromProperty);
exports.fromFunction = fromFunction;
exports.fromObservable = fromObservable;
exports.fromPatchRemote = fromPatchRemote;

exports.sync = sync;
exports.syncOn = fn.curry(syncOn);

function fromSource(source) {
	return new ProviderClient(source);
}

function fromProperty(key, objectOrArray) {
	return new ProviderClient(new PropertySource(key, objectOrArray));
}

function fromFunction(f, thisArg) {
	return new ReadOnlyProviderClient(new FunctionSource(f, thisArg));
}

function fromObservable(observable) {
	return new ReadOnlyProviderClient(new ObservableSource(observable));
}

function sync(documents) {
	return syncOn(defaultSyncSignal, documents);
}

function syncOn(signal, documents) {
	var s = typeof signal === 'number' ? most.periodic(signal) : signal;
	return new Sync(documents).run(s);
}

function fromPatchRemote(send, data) {
	return new PatchClient(send, data);
}