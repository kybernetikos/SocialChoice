var Util = require('./Util');
var zero = Util.zero, toMap = Util.toMap, group = Util.order;
var Group = require('./Group');

function Summation(dilemma) {
	this.dilemma = dilemma;
	this.choices = dilemma.choices.slice();
	this._finalScores = this.choices.map(zero);

	dilemma.forEach(function(voteCount, selection) {
		for (var i = 0; i < selection.scores.length; ++i) {
			this._finalScores[i] += selection.scores[i] * voteCount;
		}
	}.bind(this));

	this._result = group(this.choices, this._finalScores);
	this._winner = this._result[0];
}

Summation.prototype.scoreCard = function() {
	return toMap(this.choices, this._finalScores);
};
Summation.prototype.result = function() {
	return this._result;
};
Summation.prototype.winner = function() {
	return this._winner;
};


module.exports = Summation;