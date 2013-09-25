var Util = require('../Util');

function SumResult(vote) {
	var overallScoreCard = {};
	vote.forEachBallot(function(ballot, count) {
		for (var option in ballot.scoreCard) {
			if (overallScoreCard[option] === undefined) {
				overallScoreCard[option] = 0;
			}
			overallScoreCard[option] += ballot.scoreCard[option] * count;
		}
	});
	this.overallScoreCard = overallScoreCard;

	var scoredKeys = Object.keys(overallScoreCard).sort();
	var scores = scoredKeys.map(function(key) {return overallScoreCard[key];});

	this.options = scoredKeys;
	this.ranks = Util.order(scoredKeys, scores);
}

module.exports = SumResult;