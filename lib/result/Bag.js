var Util = require('../Util');

function Bag() {
	this.values = [];
	this.counts = [];
	this.length = 0;
	this.total = 0;
}

Bag.prototype.add = function(value, count) {
	count = count || 1;
	var index = Util.binarySearch(this.values, value);
	if (index >= 0) {
		this.counts[index] += count;
	} else {
		var insertionIndex = -1 - index;
		this.values.splice(insertionIndex, 0, value);
		this.counts.splice(insertionIndex, 0, count);
	}
	this.length += count;
	this.total += value * count;
};

Bag.prototype.get = function(index) {
	var realPosition = 0;
	while (index >= 0) {
		index -= this.counts[realPosition++];
	}
	return this.values[realPosition - 1];
};

Bag.prototype.min = function() {
	return this.values[0];
};

Bag.prototype.max = function() {
	return this.values[this.values.length - 1];
};

Bag.prototype.mode = function() {
	var indexes = Util.indexSort(this.counts);
	// this will choose one at random if there are multiple modes.
	return this.values[indexes[0]];
};

Bag.prototype.mean = function() {
	return this.total / this.length;
};

Bag.prototype.median = function() {
	var midPoint = (this.length / 2) - 0.5;
	if (midPoint !== (midPoint|0)) {
		var a = this.get(midPoint|0);
		var b = this.get((midPoint|0) + 1);
		return (a + b) / 2;
	}
	return this.get(midPoint);
};

module.exports = Bag;