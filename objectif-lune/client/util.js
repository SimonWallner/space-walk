var monotonicFindIndex = function(array, needle, evaluator, low, high) {
	if (low == undefined || high == undefined) {
		return monotonicFindIndex(array, needle, evaluator, 0, array.length-1);
	}

	if (low === high) {
		return low
	}

	var mid = Math.floor((low + high) / 2);

	if (evaluator(array[mid]) > needle) {
		return monotonicFindIndex(array, needle, evaluator, low, mid);
	} else {
		return monotonicFindIndex(array, needle, evaluator, mid+1, high);
	}
}