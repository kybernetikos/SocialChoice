var Group = require('./Group');

var Util = exports;

function order(dataArray, scoreArray) {
	var result = [];
	var indexArray = indexSort(scoreArray);
	var currentGroup = [];
	var currentScore = scoreArray[indexArray[0]];
	for (var i = 0; i < indexArray.length; ++i) {
		if (scoreArray[indexArray[i]] !== currentScore) {
			result.push(currentGroup);
			currentGroup = [];
			currentScore = scoreArray[indexArray[i]];
		}
		currentGroup.push(dataArray[indexArray[i]]);
	}
	if (currentGroup.length > 0) {
		result.push(currentGroup);
	}
	return result;
}
Util.order = order;

function invertRankingArray(rankingArray) {
	var result = {};
	for (var i = 0; i < rankingArray.length; ++i) {
		Group.forEach(rankingArray[i], function(value) {
			result[value] = i;
		});
	}
	return result;
}
Util.invertRankingArray = invertRankingArray;

function range(to) {
	var result = [];
	for (var i = 0; i < to; ++i) {
		result[i] = i;
	}
	return result;
}
Util.range = range;

function zero() {
	return 0;
}
Util.zero = zero;

function indexSort(array) {
	var result = range(array.length);
	result.sort(function(a, b) {
		return array[b] - array[a];
	});
	return result;
}
Util.indexSort = indexSort;

function squareArray(size) {
	var matrix = new Array(size);
	for (var i = 0; i < size; ++i) {
		matrix[i] = new Array(size);
		for (var j = 0; j < size; ++j) {
			matrix[i][j] = 0;
		}
	}
	return matrix;
}
Util.squareArray = squareArray;

function toMap(keys, values) {
	var result = {};
	for (var i = 0; i < keys.length; ++i) {
		result[keys[i]] = values[i];
	}
	return result;
}
Util.toMap = toMap;

function notIn(array) {
	var excludedValues = array.slice();
	return function(value) {
		return excludedValues.indexOf(value) < 0;
	};
}
Util.notIn = notIn;