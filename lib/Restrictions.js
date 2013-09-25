exports.noWriteIns = function noWriteIns(config, ballot) {
	var values = config.options;
	for (var i = 0; i < ballot.rankedOptions.length; ++i) {
		if (values.indexOf(ballot.rankedOptions[i]) < 0) {
			throw new Error("Unable to cast a vote for "+ballot.rankedOptions[i]+" as it is not one of the allowed options "+values.join(", "));
		}
	}
};

exports.selectAtLeast = function selectAtLeast(number) {
	return function(config, ballot) {
		var n = number || config.options.length;
		if (ballot.rankedOptions.length < n) {
			throw new Error("You voted for "+ballot.rankedOptions.length+" but valid ballots must have at least "+n+" selections.");
		}
	};
};

exports.selectAtMost = function selectAtMost(number) {
	return function(config, ballot) {
		var n = number || config.options.length;
		if (ballot.rankedOptions.length > n) {
			throw new Error("You voted for "+ballot.rankedOptions.length+" but valid ballots must have at most "+n+" selections.");
		}
	};
};

exports.selectExactly = function selectExactly(number) {
	return function(config, ballot) {
		var n = number || config.options.length;
		if (ballot.rankedOptions.length !== n) {
			throw new Error("You voted for "+ballot.rankedOptions.length+" but valid ballots must have exactly "+n+" selections.");
		}
	};
};