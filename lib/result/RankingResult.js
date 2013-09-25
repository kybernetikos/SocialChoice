var AcyclicPathMatrix = require('../AcyclicPathMatrix');
var MirrorMatrix = require('../MirrorMatrix');
var ImaginaryContest = require('../ImaginaryContest');
var Group = require('../Group');
var Util = require('../Util');

function RankingResult(vote) {
	this.choices = vote.allOptions();

	this.rankingMatrix = new MirrorMatrix(this.choices);
	this.imaginaryContests = [];
	for (var i = 0; i < this.choices.length; ++i) {
		for (var j = i + 1; j < this.choices.length; ++j) {
			this.imaginaryContests.push(new ImaginaryContest(this.rankingMatrix, this.choices[i], this.choices[j]));
		}
	}

	vote.forEachBallot(function(ballot, voteCount) {
		var rankedSets = ballot.ranks;
		for (var i = 0; i < rankedSets.length; ++i) {
			for (var j = i + 1; j < rankedSets.length; ++j) {
				this._addPreference(voteCount, rankedSets[i], rankedSets[j]);
			}
		}
	}.bind(this));
}

RankingResult.prototype._addPreference = function(number, preferred, lessPreferred) {
	var rankMatrix = this.rankingMatrix;
	Group.forEach(preferred, function(preferredValue) {
		Group.forEach(lessPreferred, function(lessPreferredValue) {
			rankMatrix.increment(preferredValue, lessPreferredValue, number);
		});
	});
};

RankingResult.prototype.rankedPairs = function() {
	var paths = new AcyclicPathMatrix(this.choices);

	// TODO: do something not-arbitrary when the contests have equal margins.
	this.imaginaryContests.slice().filter(function(contest) {
		return contest.victoryMargin() > 0;
	}).sort(function(a, b) {
				return b.victoryMargin() - a.victoryMargin();
			}).forEach(function(contest) {
				paths.set(contest.winner(), contest.loser(), 1);
			});

	var totals = paths._rowTotals().map(function(rowTotals) {
		return rowTotals["-1"] || 0;
	});

	return Util.order(this.choices, totals).reverse();
};

module.exports = RankingResult;