var Util = require('./Util');
var range = Util.range, toMap = Util.toMap, notIn = Util.notIn, indexSort = Util.indexSort, group = Util.order, zero = Util.zero;
var Group = require('./Group');

function InstantRunoff(dilemma) {
	this.dilemma = dilemma;

	var options = dilemma.choices.slice();
	var choicesMap = toMap(options, range(options.length));
	this.pluralityWinner = undefined;
	var excluded = [];

	var uniqueValues = {length: 3};
	// TODO: work out the correct victory criteria - normally IRV is considered to run
	// until one candidate has more than 50% of the vote.  This might not work though if
	// there is a genuine three way tie.
	// This victory criteria - continue the run offs until there are two groups with equal scores
	// is pretty different to that.
	while (uniqueValues.length > 2) {
		var scores = options.map(zero);
		dilemma.forEach(function(voteCount, selection) {
			var winner = Group.filter(selection.getRankedSets(), notIn(excluded))[0];
			if (winner !== undefined) {
				Group.forEach(winner, function(value) {
					scores[choicesMap[value]] += voteCount;
				});
			}
		});
		uniqueValues = scores.slice().filter(function(value, index, array) {
			return value !== 0 && array.indexOf(value) === index;
		});

		if (this.pluralityWinner === undefined) {
			var groupings = group(options, scores);
			this.pluralityWinner = groupings[0];
		}

		var reversedScoreIndexes = indexSort(scores).filter(function(a) {
			return scores[a] > 0;
		}).reverse();

		excluded.push(options[reversedScoreIndexes[0]]);

	}
	this.result = group(options, scores);
}

InstantRunoff.prototype.winner = function() {
	return this.result[0];
};

module.exports = InstantRunoff;