function ImaginaryContest(baseMatrix, x, y) {
	this.baseMatrix = baseMatrix;
	this.x = x;
	this.y = y;
}

ImaginaryContest.prototype.winner = function() {
	return (this.baseMatrix.get(this.x, this.y) > this.baseMatrix.get(this.y, this.x)) ? this.x : this.y;
};

ImaginaryContest.prototype.loser = function() {
	return (this.baseMatrix.get(this.x, this.y) <= this.baseMatrix.get(this.y, this.x)) ? this.x : this.y;
};

ImaginaryContest.prototype.isDraw = function() {
	return (this.baseMatrix.get(this.x, this.y) === this.baseMatrix.get(this.y, this.x));
};

ImaginaryContest.prototype.victoryMargin = function() {
	var forX = this.baseMatrix.get(this.x, this.y);
	var forY = this.baseMatrix.get(this.y, this.x);
	return Math.abs(forX - forY);
};

ImaginaryContest.prototype.voteCount = function() {
	return this.baseMatrix.get(this.x, this.y) + this.baseMatrix.get(this.y, this.x);
};

ImaginaryContest.prototype.victorVoteCount = function() {
	return Math.max(this.baseMatrix.get(this.x, this.y), this.baseMatrix.get(this.y, this.x));
};

ImaginaryContest.prototype.loserVoteCount = function() {
	return Math.min(this.baseMatrix.get(this.x, this.y), this.baseMatrix.get(this.y, this.x));
};

ImaginaryContest.prototype.toString = function() {
	return this.winner() + " beats "+ this.loser();
};

module.exports = ImaginaryContest;