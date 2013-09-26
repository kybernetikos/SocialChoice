var ScoredBallot = require('./ScoredBallot');

// Disallows any ballot that specifies an option not in the config.
exports.noWriteIns = function noWriteIns(problems, config, ballot) {
	var isValid = true;
	var values = config.options || [];
	for (var i = 0; i < ballot.rankedOptions.length; ++i) {
		if (values.indexOf(ballot.rankedOptions[i]) < 0) {
			problems.push("Unable to cast a vote for "+ballot.rankedOptions[i]+" as it is not one of the allowed options "+values.join(", "));
			isValid = false;
		}
	}
	return isValid;
};

// Disallows any ballot that doesn't specify rankings/scores for at least number options.
exports.selectAtLeast = function selectAtLeast(number) {
	return function(problems, config, ballot) {
		var isValid = true;
		var n = number || config.options.length;
		if (ballot.rankedOptions.length < n) {
			problems.push("You voted for "+ballot.rankedOptions.length+" but valid ballots must have at least "+n+" selections.");
			isValid = false;
		}
		return isValid;
	};
};

// Disallows any ballot that specifies more than number options ('truncated ballot').
exports.selectAtMost = function selectAtMost(number) {
	return function(problems, config, ballot) {
		var isValid = true;
		var n = number || config.options.length;
		if (ballot.rankedOptions.length > n) {
			problems.push("You voted for "+ballot.rankedOptions.length+" but valid ballots must have at most "+n+" selections.");
			isValid = false;
		}
		return isValid;
	};
};

// Disallows any ballot that doesn't specify exactly number options.
// selectExactly(1), is a restriction that will only allow you to cast ballots for a single
// candidate.  This is like a FPTP election.
exports.selectExactly = function selectExactly(number) {
	return function(problems, config, ballot) {
		var isValid = true;
		var n = number || config.options.length;
		if (ballot.rankedOptions.length !== n) {
			problems.push("You voted for "+ballot.rankedOptions.length+" but valid ballots must have exactly "+n+" selections.");
			isValid = false;
		}
		return isValid;
	};
};

exports.scoreInRange = function scoreInRange(min, max) {
	return function(problems, config, ballot) {
		var isValid = true;
		if (ballot instanceof ScoredBallot) {
			var mn = min || 0;
			var mx = max || 100;

			if (ballot.minScore !== null && ballot.minScore < mn) {
				problems.push("Cannot submit a ballot with a minimum score less than "+mn+", was "+ballot.minScore);
				isValid = false;
			}

			if (ballot.maxScore !== null && ballot.maxScore > mx) {
				problems.push("Cannot submit a ballot with a maximum score more than "+mx+", was "+ballot.maxScore);
				isValid = false;
			}
		}
		return isValid;
	}
};