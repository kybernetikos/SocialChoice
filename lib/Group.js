var Group = exports;

Group.forEach = function(thing, func) {
	if (Array.isArray(thing)) {
		thing.forEach(func);
	} else {
		func(thing);
	}
};

Group.is = function(thing, test) {
	if (Array.isArray(test)) {
		if (test.length === 1) {
			return thing === test[0];
		}
		if (thing.length !== test.length) {
			return false;
		}
		for (var i = 0; i < test.length; ++i) {
			if (test[i] !== thing[i]) {
				return false;
			}
		}
		return true;
	} else {
		return thing === test || (Array.isArray(thing) && thing.length === 1 && thing[0] === test);
	}
};

Group.flatten = function(array, result) {
	result = result || [];
	for (var i = 0; i < array.length; ++i) {
		if (Array.isArray(array[i])) {
			Group.flatten(array[i], result);
		} else {
			result.push(array[i]);
		}
	}
	return result;
};

Group.count = function count(array) {
	var result = 0;
	for (var i = 0; i < array.length; ++i) {
		result += Group.size(array[i]);
	}
	return result;
};

Group.size = function(thing) {
	if (Array.isArray(thing)) {
		return thing.length;
	} else {
		return 1;
	}
};

Group.filter = function(arg, filterFunc) {
	if (Array.isArray(arg)) {
		var result = [];
		arg.forEach(function(value) {
			var filteredVal = Group.filter(value, filterFunc);
			if (filteredVal !== undefined) {
				result.push(filteredVal);
			}
		});
		if (result.length > 0) {
			return result;
		}
		return undefined;
	} else {
		if (filterFunc(arg)) {
			return arg;
		}
		return undefined;
	}
};