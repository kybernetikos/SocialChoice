var Util = require('./Util');
var Group = require('./Group');
var MirrorMatrix = require('./MirrorMatrix');
var ImaginaryContest = require('./ImaginaryContest');
var AcyclicPathMatrix = require('./AcyclicPathMatrix');

function RankedBallot(rankings) {
	rankings = Array.prototype.slice.call(rankings);
	for (var i = 0; i < rankings.length; i++) {
		if (rankings[i] instanceof Array) {
			rankings[i] = rankings[i].slice();
			rankings[i].sort();
		}
	}
	this.ranks = rankings;
	this.rankedOptions = Group.flatten(this.ranks);
	this.count = this.rankedOptions.length;
	this.optionToRank = Util.invertRankingArray(rankings);
	this.maxRank = rankings.length - 1;

	this.hashkey = "("+rankings.join("),(")+")";
}

function ScoredBallot(scoreCard) {
	this.scoreCard = scoreCard;
	var scoredKeys = Object.keys(scoreCard).sort();
	var scores = scoredKeys.map(function(key) {return scoreCard[key];});
	
	var sortedScoreIndex = Util.indexSort(scores);

	this.ranks = Util.order(scoredKeys, scores);
	this.rankedOptions = scoredKeys;
	this.optionToRank = Util.invertRankingArray(this.ranks);
	this.maxRank = this.ranks.length - 1;

	this.minScore = scores[sortedScoreIndex[sortedScoreIndex.length - 1]];
	this.maxScore = scores[sortedScoreIndex[0]];
	this.count = scoredKeys.length;

	this.hashkey = sortedScoreIndex.map(function(value) {
		return scoredKeys[value]+":"+scores[value];
	}).join(",");
}

function Vote(config) {
	this.votingHasCommenced = false;
	this.restrictions = [];
	this.ballotTransforms = [];
	this.ballots = {};
	this.voteCount = {};
	this.voters = 0;
	this.config = config;
	this.optionsVotedFor = {};
}

Vote.prototype.addTransform = function(transform) {
	this.ballotTransforms.push.apply(this.ballotTransforms, arguments);
};

Vote.prototype.restrict = function(restriction) {
	if (this.votingHasCommenced === true) {
		throw new Error("Voting has already commenced.");
	}
	this.restrictions.push.apply(this.restrictions, arguments);
};

Vote.prototype.cast = function(ballot, times) {
	times = times || 1;
	for (var i = 0; i < this.restrictions.length; ++i) {
		this.restrictions[i](this.config, ballot);
	}
	this.votingHasCommenced = true;
	if (this.ballots[ballot.hashkey] === undefined) {
		this.ballots[ballot.hashkey] = ballot;
		this.voteCount[ballot.hashkey] = 0;
	}
	for (var i = 0; i < ballot.rankedOptions.length; ++i) {
		this.optionsVotedFor[ballot.rankedOptions[i]] = true;
	}
	this.voteCount[ballot.hashkey] += times;
	this.voters += times;
};

Vote.prototype.forEachBallot = function(func) {
	for (var key in this.ballots) {
		var ballot = this.ballots[key];
		for (var i = 0; i < this.ballotTransforms.length; ++i) {
			ballot = this.ballotTransforms[i](this.config, ballot, this);
		}
		var voteCount = this.voteCount[key];
		func(ballot, voteCount);
	}
};

Vote.prototype.allOptions = function() {
	var allOptions = Object.keys(vote.optionsVotedFor);
	var config = this.config;
	if (config.options) {
		for (var i = 0; i < config.options.length; ++i) {
			if (allOptions.indexOf(config.options[i]) < 0) {
				allOptions.push(config.options[i]);
			}
		}
	}
	return allOptions;
}

Vote.prototype.rank = function(times) {
	var ballot = new RankedBallot(Array.prototype.slice.call(arguments, 1));
	this.cast(ballot, times);
};

Vote.prototype.approve = function(times) {
	var ballot = new RankedBallot([Array.prototype.slice.call(arguments, 1)]);
	this.cast(ballot, times);
};

Vote.prototype.score = function(times, scoreCard) {
	var ballot = new ScoredBallot(scoreCard);
	this.cast(ballot, times);
};

Vote.prototype.getSumResult = function() {
	return new SumResult(this);
};

Vote.prototype.getPluralityResult = function() {
	return new PluralityResult(this);
};

Vote.prototype.getRunOffResult = function() {
	return new RunOffResult(this);
};

Vote.prototype.getRankingResult = function() {
	return new RankingResult(this);
};

// Restrictions /////////////////////////////////////////////////////////////////////////////

function noWriteIns(config, ballot) {
	var values = config.options;
	for (var i = 0; i < ballot.rankedOptions.length; ++i) {
		if (values.indexOf(ballot.rankedOptions[i]) < 0) {
			throw new Error("Unable to cast a vote for "+ballot.rankedOptions[i]+" as it is not one of the allowed options "+values.join(", "));
		}
	}
}

function selectAtLeast(number) {
	return function(config, ballot) {
		var n = number || config.options.length;
		if (ballot.rankedOptions.length < n) {
			throw new Error("You voted for "+ballot.rankedOptions.length+" but valid ballots must have at least "+n+" selections.");
		}
	};
}

function selectAtMost(number) {
	return function(config, ballot) {
		var n = number || config.options.length;
		if (ballot.rankedOptions.length > n) {
			throw new Error("You voted for "+ballot.rankedOptions.length+" but valid ballots must have at most "+n+" selections.");
		}
	};
}

function selectExactly(number) {
	return function(config, ballot) {
		var n = number || config.options.length;
		if (ballot.rankedOptions.length !== n) {
			throw new Error("You voted for "+ballot.rankedOptions.length+" but valid ballots must have exactly "+n+" selections.");
		}
	};
}

// Ballot transforms //////////////////////////////////////////////////////////////////////////////////

function missing(config, ballot, vote) {
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

	if (ballot instanceof RankedBallot) {
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
}

function borda(scoreFromRank) {
	scoreFromRank = scoreFromRank || function(rank, config, ballot, vote) {
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
}

// example code ////////////////////////////////////////////////////////////////////////////

function SumResult(vote) {
	var overallScoreCard = {};
	vote.forEachBallot(function(ballot, count) {
		for (var option in ballot.scoreCard) {
			if (overallScoreCard[option] === undefined) {
				overallScoreCard[option] = 0;
			}
			overallScoreCard[option] += ballot.scoreCard[option] * count;
		}
	});
	this.overallScoreCard = overallScoreCard;

	var scoredKeys = Object.keys(overallScoreCard).sort();
	var scores = scoredKeys.map(function(key) {return overallScoreCard[key];});
	var sortedScoreIndex = Util.indexSort(scores);

	this.options = scoredKeys;
	this.ranks = Util.order(scoredKeys, scores);
}

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
	var sortedScoreIndex = Util.indexSort(scores);

	this.options = scoredKeys;
	this.ranks = Util.order(scoredKeys, scores);
}

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


var vote = new Vote({
	options: ["c", "b", "a", "d", "e"]
});


vote.restrict(
	noWriteIns
);
vote.addTransform(
	missing,
	borda()
);

vote.rank(10, "c", "a");
vote.score(4, {"d": 10, a: 2});
vote.score(100, {});


console.log(vote.getSumResult());
console.log(vote.getPluralityResult());
var rr = vote.getRankingResult();
console.log(rr.rankedPairs());
console.log(vote.getRunOffResult());