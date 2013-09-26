var Util = require('../Util');
var squareArray = Util.squareArray, toMap = Util.toMap, range = Util.range;

function Matrix(options) {
	this.options = options;
	this.matrix = squareArray(options.length);
	this.choicesMap = toMap(options, range(options.length));
}

Matrix.prototype.set = function(xOption, yOption, value) {
	this.matrix[this.choicesMap[xOption]][this.choicesMap[yOption]] = value;
};

Matrix.prototype.get = function(xOption, yOption) {
	return this.matrix[this.choicesMap[xOption]][this.choicesMap[yOption]];
};

Matrix.prototype.increment = function(xOption, yOption, value) {
	var previousValue = this.get(xOption, yOption);
	this.set(xOption, yOption, previousValue + value);
};

Matrix.prototype._rowTotals = function() {
	return this.matrix.map(function(row) {
		return row.reduce(function(accumulator, value) {
			if (accumulator[value] === undefined) {
				accumulator[value] = 0;
			}
			accumulator[value]++;
			return accumulator;
		}, {});
	});
};

module.exports = Matrix;