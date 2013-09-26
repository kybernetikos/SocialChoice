var RankedBallot = require('./RankedBallot');
var Util = require('./Util');

function ScoredBallot(scoreCard) {
	this.scoreCard = scoreCard;

	var scoredKeys = Object.keys(scoreCard).sort();
	var scores = scoredKeys.map(function(key) {return scoreCard[key];});

	RankedBallot.call(this, Util.order(scoredKeys, scores));

	var sortedScoreIndex = Util.indexSort(scores);
	this.minScore = scores[sortedScoreIndex[sortedScoreIndex.length - 1]];
	this.maxScore = scores[sortedScoreIndex[0]];
	this.count = scoredKeys.length;

	this.hashkey = sortedScoreIndex.map(function(value) {
		return scoredKeys[value]+":"+scores[value];
	}).join(",");
}

ScoredBallot.prototype = Object.create(RankedBallot.prototype, {
	constructor: {value: ScoredBallot}
});

module.exports = ScoredBallot;