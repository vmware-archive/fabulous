exports.findIndex = findIndex;

function findIndex(compare, task, tasks) {
	var lo = 0;
	var hi = tasks.length;
	var mid, cmp;

	while (lo < hi) {
		mid = Math.floor((lo + hi) / 2);
		cmp = compare(task, tasks[mid].deadline);

		if (cmp === 0) {
			return mid;
		} else if (cmp < 0) {
			hi = mid;
		} else {
			lo = mid + 1;
		}
	}
	return hi;
}