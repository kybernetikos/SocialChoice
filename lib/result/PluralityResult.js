var Util = require('../Util');
var Group = require('../Group');

var EMPTY_ARRAY = [];

function frontRunnerScores(vote, excluded) {
	excluded = excluded || EMPTY_ARRAY;
	var frontRunnerCount = {};

	var allOptions = vote.allOptions();
	allOptions.forEach(function(option) {
		if (excluded.indexOf(option) < 0) {
			frontRunnerCount[option] = 0;
		}
	});

	vote.forEachBallot(function(ballot, voteCount) {
		var winner = Group.filter(ballot.ranks, Util.notIn(excluded))[0];
		if (winner !== undefined) {
			Group.forEach(winner, function(value) {
				frontRunnerCount[value] += voteCount;
			});
		}
	});
	return frontRunnerCount;
}

function PluralityResult(vote) {
	this.voteCount = frontRunnerScores(vote);
	this.ranks = Util.rankScoreCard(this.voteCount);
	this.options = Group.flatten(this.ranks);
	this.winner = this.ranks[0];
}

PluralityResult.frontRunnerScores = frontRunnerScores;

module.exports = PluralityResult;