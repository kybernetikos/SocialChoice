var Group = exports;

Group.forEach = function(thing, func) {
	if (thing instanceof Array) {
		thing.forEach(func);
	} else {
		func(thing);
	}
};

Group.is = function(thing, test) {
	if (test instanceof Array) {
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
		return thing === test || (thing instanceof Array && thing.length === 1 && thing[0] === test);
	}
};

Group.flatten = function(array, result) {
	result = result || [];
	for (var i = 0; i < array.length; ++i) {
		if (array[i] instanceof Array) {
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
	if (thing instanceof Array) {
		return thing.length;
	} else {
		return 1;
	}
};

Group.filter = function(arg, filterFunc) {
	if (arg instanceof Array) {
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