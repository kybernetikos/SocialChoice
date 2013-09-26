var Util = require('../Util');
var Bag = require('./Bag');
var ScoredBallot = require('../ScoredBallot');

function SumResult(vote) {
	var overallScoreCard = {};
	vote.forEachBallot(function(ballot, count) {
		if (ballot instanceof ScoredBallot === false) {
			throw new Error("Cannot calculate the sum for ballots without scores. Consider adding a borda transform.");
		}
		for (var option in ballot.scoreCard) {
			if (overallScoreCard[option] === undefined) {
				overallScoreCard[option] = new Bag();
			}
			overallScoreCard[option].add(ballot.scoreCard[option], count);
		}
	});

	this.overallScoreCard = overallScoreCard;
	this.options = Object.keys(overallScoreCard);

	this.ranks = Util.rankScoreCard(overallScoreCard, function(stat) {
		return stat.total;
	});
	this.winner = this.ranks[0];
	this.medianRanks = Util.rankScoreCard(overallScoreCard, function(stat) {
		return stat.median();
	});
	this.meanRanks = Util.rankScoreCard(overallScoreCard, function(stat) {
		return stat.mean();
	});


}

module.exports = SumResult;