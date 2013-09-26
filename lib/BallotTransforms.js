var RankedBallot = require('./RankedBallot');
var ScoredBallot = require('./ScoredBallot');
var Group = require('./Group');

// Fills in any missing choices, placing them joint last rank for a ranked ballot or giving them
// a score of 0 for a scored ballot.
exports.missing = function missing(config, ballot, vote) {
	var allOptions = vote.allOptions();
	var missingOptions = [];
	for (var i = 0; i < allOptions.length; ++i) {
		var option = allOptions[i];
		if (ballot.rankedOptions.indexOf(option) < 0) {
			missingOptions.push(option);
		}
	}

	if (missingOptions.length === 0) {
		return ballot;
	}

	if (ballot instanceof ScoredBallot === false && ballot instanceof RankedBallot) {
		var missingOptionsRank = config.missingOptionsRank;
		var rankings = ballot.ranks.slice();
		if (missingOptionsRank == null) {
			rankings.push(missingOptions);
		} else {
			rankings.splice(missingOptionsRank, 0, missingOptions);
		}
		return new RankedBallot(rankings);
	} else if (ballot instanceof ScoredBallot) {
		var scoreCard = {};
		for (var key in ballot.scoreCard) {
			scoreCard[key] = ballot.scoreCard[key];
		}
		var missingScore = config.missingOptionsScore || 0;
		for (var i = 0; i < missingOptions.length; ++i) {
			scoreCard[missingOptions[i]] = missingScore;
		}
		return new ScoredBallot(scoreCard);
	}
	throw new Error("Ballot not of a known type.");
};

// Makes ranked ballots into scored ballots according to a configurable scheme.
exports.borda = function borda(scoreFromRank) {
	scoreFromRank = scoreFromRank || function(rank, config, ballot, vote) {
		// this is a modified borda count scheme
		return (ballot.ranks.length - 1) - rank;
	};

	return function(config, ballot, vote) {
		if (ballot instanceof RankedBallot) {
			var scoreCard = {};
			for (var i = 0; i < ballot.ranks.length; ++i) {
				Group.forEach(ballot.ranks[i], function(option) {
					scoreCard[option] = scoreFromRank(i, config, ballot, vote);
				});
			}
			return new ScoredBallot(scoreCard);
		}
		return ballot;
	}
};