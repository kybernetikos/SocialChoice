var Util = require('../Util');
var Group = require('../Group');

function RunOffResult(vote) {
	var options = vote.allOptions();
	var choicesMap = Util.toMap(options, Util.range(options.length));
	var excluded = [];

	var uniqueValues = {length: 3};
	// TODO: work out the correct victory criteria - normally IRV is considered to run
	// until one candidate has more than 50% of the vote.  This might not work though if
	// there is a genuine three way tie.
	// This victory criteria - continue the run offs until there are two groups with equal scores
	// is pretty different to that.
	while (uniqueValues.length > 2) {
		var scores = options.map(Util.zero);
		vote.forEachBallot(function(ballot, voteCount) {
			var winner = Group.filter(ballot.ranks, Util.notIn(excluded))[0];
			if (winner !== undefined) {
				Group.forEach(winner, function(value) {
					scores[choicesMap[value]] += voteCount;
				});
			}
		});
		uniqueValues = scores.slice().filter(function(value, index, array) {
			return value !== 0 && array.indexOf(value) === index;
		});

		var reversedScoreIndexes = Util.indexSort(scores).filter(function(a) {
			return scores[a] > 0;
		}).reverse();

		excluded.push(options[reversedScoreIndexes[0]]);
	}
	this.result = Util.order(options, scores);
};

module.exports = RunOffResult;