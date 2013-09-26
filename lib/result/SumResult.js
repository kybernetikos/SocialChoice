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
	this.ranks = Util.rankScoreCard(overallScoreCard);
	this.options = Object.keys(overallScoreCard);
}

module.exports = SumResult;