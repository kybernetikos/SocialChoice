var AcyclicPathMatrix = require('./AcyclicPathMatrix');
var Matrix = require('./Matrix');
var ImaginaryContest = require('./ImaginaryContest');
var Group = require('../Group');
var Util = require('../Util');

function RankingResult(vote) {
	this.vote = vote;
	this.choices = vote.allOptions();

	this.voteMatrix = new Matrix(this.choices);
	this.imaginaryContests = [];
	for (var i = 0; i < this.choices.length; ++i) {
		for (var j = i + 1; j < this.choices.length; ++j) {
			this.imaginaryContests.push(new ImaginaryContest(this.voteMatrix, this.choices[i], this.choices[j]));
		}
	}

	vote.forEachBallot(function(ballot, voteCount) {
		var rankedSets = ballot.ranks;
		var voteMatrix = this.voteMatrix;
		for (var i = 0; i < rankedSets.length; ++i) {
			for (var j = i + 1; j < rankedSets.length; ++j) {
				Group.forEach(rankedSets[i], function(preferred) {
					Group.forEach(rankedSets[j], function(lessPreferred) {
						voteMatrix.increment(preferred, lessPreferred, voteCount);
					});
				});
			}
		}
	}.bind(this));
}

RankingResult.prototype.rankedPairs = function(contestImportanceFunction) {
	contestImportanceFunction = contestImportanceFunction || function(contest, vote) {
		// this mainly considers the victory margin, but uses the number of votes for the victor
		// as a tie break.
		return contest.victoryMargin() + (contest.victorVoteCount() / vote.voters);
	};

	var vote = this.vote;
	var paths = new AcyclicPathMatrix(this.choices);

	this.imaginaryContests.filter(function(contest) {
		return contest.isDraw() == false;
	}).sort(function(a, b) {
		return contestImportanceFunction(b, vote) - contestImportanceFunction(a, vote);
	}).forEach(function(contest) {
		paths.set(contest.winner(), contest.loser(), 1);
	});

	// ranking goes from least transitive defeats to most transitive defeats.
	var totals = paths._rowTotals().map(function(rowTotals) {
		return rowTotals["-1"] || 0;
	});

	return Util.order(this.choices, totals).reverse();
};

module.exports = RankingResult;