var Util = require('../Util');
var Stat = require('./Stat');

function SumResult(vote) {
	var overallScoreCard = {};
	vote.forEachBallot(function(ballot, count) {
		for (var option in ballot.scoreCard) {
			if (overallScoreCard[option] === undefined) {
				overallScoreCard[option] = new Stat();
			}
			overallScoreCard[option].push(ballot.scoreCard[option], count);
		}
	});

	this.overallScoreCard = overallScoreCard;
	this.options = Object.keys(overallScoreCard);

	this.ranks = Util.rankScoreCard(overallScoreCard);
	this.medianRanks = Util.rankScoreCard(overallScoreCard, function(stat) {
		console.log(stat.median());
		return stat.median();
	});
	this.meanRanks = Util.rankScoreCard(overallScoreCard, function(stat) {
		return stat.mean();
	});


}

module.exports = SumResult;