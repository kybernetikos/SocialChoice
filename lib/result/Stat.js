function Stat() {
	this.values = [];
	this.min = null;
	this.max = null;
	this.total = 0;
}

Stat.prototype.push = function(value, times) {
	times = times || 1;
	if (this.min === null || this.min > value) {
		this.min = value;
	}
	if (this.max === null || this.max < value) {
		this.max = value;
	}

	for (var i = 0; i < times; ++i) {
		this.values.push(value);
	}

	this.total += value * times;
};

Stat.prototype.mean = function() {
	return this.total / this.values.length;
};

Stat.prototype.median = function() {
	if (this.values.length === 0) {
		return null;
	}

	this.values.sort();

	var midPoint = (this.values.length / 2) - 0.5;
	if (midPoint !== (midPoint|0)) {
		var a = this.values[midPoint|0];
		var b = this.values[(midPoint|0) + 1];
		return (a + b) / 2;
	}
	return this.values[midPoint];
};

Stat.prototype.toString = function() {
	return "(min:"+this.min+" max:"+this.max+" total:"+this.total+" mean:"+this.mean()+" median:"+this.median();
};

Stat.prototype.valueOf = function() {
	return this.total;
};

module.exports = Stat;