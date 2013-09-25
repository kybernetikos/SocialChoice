var Util = require('./Util');

function ScoredBallot(scoreCard) {
	this.scoreCard = scoreCard;
	var scoredKeys = Object.keys(scoreCard).sort();
	var scores = scoredKeys.map(function(key) {return scoreCard[key];});

	var sortedScoreIndex = Util.indexSort(scores);

	this.ranks = Util.order(scoredKeys, scores);
	this.rankedOptions = scoredKeys;
	this.optionToRank = Util.invertRankingArray(this.ranks);
	this.maxRank = this.ranks.length - 1;

	this.minScore = scores[sortedScoreIndex[sortedScoreIndex.length - 1]];
	this.maxScore = scores[sortedScoreIndex[0]];
	this.count = scoredKeys.length;

	this.hashkey = sortedScoreIndex.map(function(value) {
		return scoredKeys[value]+":"+scores[value];
	}).join(",");
}

module.exports = ScoredBallot;