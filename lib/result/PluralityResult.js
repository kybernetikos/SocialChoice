var Util = require('../Util');
var Group = require('../Group');

function PluralityResult(vote) {
	var voteCount = {};
	var allOptions = vote.allOptions();
	for (var i = 0; i < allOptions.length; ++i) {
		voteCount[allOptions[i]] = 0;
	}
	vote.forEachBallot(function(ballot, count) {
		var winners = ballot.ranks[0];
		if (winners.length < allOptions.length) {
			Group.forEach(winners, function(winningOption) {
				voteCount[winningOption] += count;
			});
		}
	});
	this.voteCount = voteCount;

	var scoredKeys = Object.keys(voteCount).sort();
	var scores = scoredKeys.map(function(key) {return voteCount[key];});

	this.options = scoredKeys;
	this.ranks = Util.order(scoredKeys, scores);
}

module.exports = PluralityResult;