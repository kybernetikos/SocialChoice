var Util = require('../Util');
var Group = require('../Group');

var PluralityResult = require('./PluralityResult');

function RunOffResult(vote) {
	var eliminations = [];

	var voteCount = PluralityResult.frontRunnerScores(vote);
	var ranks = Util.rankScoreCard(voteCount);

	while (ranks.length > 1) {
		var lastItems = ranks[ranks.length - 1];
		eliminations.push(lastItems);

		voteCount = PluralityResult.frontRunnerScores(vote, Group.flatten(eliminations));
		ranks = Util.rankScoreCard(voteCount);
	}

	var result = eliminations.slice().reverse();
	if (ranks.length > 0) {
		result.unshift(ranks[0]);
	}

	this.ranks = result;
	this.options = Group.flatten(result);
};

module.exports = RunOffResult;