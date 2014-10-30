module.exports = createMultipartSender;

var partHeaderStart = '\nContent-Type: application/json-patch+json\n';

function createMultipartSender(send) {
	return function(patches) {
		return send({
			headers: {
				'Content-Type': 'multipart/mixed;boundary="patch-boundary"'
			},
			entity: makeMultipartJsonPayload('patch-boundary', patches)
		});
	}
}

function makeMultipartJsonPayload (boundary, patches) {
	return patches.reduceRight(function (s, patch) {
		return makeBoundary(boundary) + partHeaderStart + makePartHeaders(patch) + '\n' + JSON.stringify(patch.patch) + s;
	}, makeEnd(boundary));
}

function makePartHeaders(patch) {
	return 'X-Version: ' + patch.localVersion + ',' + patch.remoteVersion + '\n';
}

function makeBoundary(b) {
	return '\n--' + b;
}

function makeEnd(b) {
	return makeBoundary(b) + '--';
}