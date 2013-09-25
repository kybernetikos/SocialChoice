function ImaginaryContest(baseMatrix, x, y) {
	this.baseMatrix = baseMatrix;
	this.x = x;
	this.y = y;
}
ImaginaryContest.prototype.victoryMargin = function() {
	return Math.abs(this.baseMatrix.get(this.x, this.y));
};
ImaginaryContest.prototype.winner = function() {
	return (this.baseMatrix.get(this.x, this.y) > 0) ? this.x : this.y;
};
ImaginaryContest.prototype.loser = function() {
	return (this.baseMatrix.get(this.x, this.y) > 0) ? this.y : this.x;
};
ImaginaryContest.prototype.toString = function() {
	return this.winner() + " beats "+ this.loser();
};

module.exports = ImaginaryContest;