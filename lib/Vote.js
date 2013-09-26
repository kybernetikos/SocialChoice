var RankedBallot = require('./RankedBallot');
var ScoredBallot = require('./ScoredBallot');

var SumResult = require('./result/SumResult');
var PluralityResult = require('./result/PluralityResult');
var RunOffResult = require('./result/RunOffResult');
var RankingResult = require('./result/RankingResult');

var Restrictions = require('./Restrictions');
var BallotTransforms = require('./BallotTransforms');

var slice = Array.prototype.slice;
var push = Array.prototype.push;

function Vote(config) {
	this.votingHasCommenced = false;
	this.restrictions = [];
	this.ballotTransforms = [];
	this.ballots = {};
	this.voteCount = {};
	this.voters = 0;
	this.config = config || {};
	this.optionsVotedFor = {};

	var restrictions = this.config.restrict || (this.config.options ? [Restrictions.noWriteIns] : []);
	this.setRestrictions.apply(this, restrictions);

	var transforms = (this.config.transform) || [BallotTransforms.missing];
	this.setTransforms.apply(this, transforms);
}

Vote.prototype.setTransforms = function(transform) {
	this.ballotTransforms = [];
	this.addTransform.apply(this, arguments);
};

Vote.prototype.addTransform = function(transform) {
	push.apply(this.ballotTransforms, arguments);
};

Vote.prototype.setRestrictions = function(restriction) {
	this.restrictions = [];
	this.restrict.apply(this, arguments);
}
Vote.prototype.restrict = function(restriction) {
	if (this.votingHasCommenced === true) {
		throw new Error("Voting has already commenced.");
	}
	push.apply(this.restrictions, arguments);
};

Vote.prototype.check = function(ballot) {
	var problems = [];
	for (var i = 0; i < this.restrictions.length; ++i) {
		this.restrictions[i](problems, this.config, ballot);
	}
	return problems;
};

Vote.prototype.cast = function(ballot, times) {
	times = times || 1;
	var problems = this.check(ballot);
	if (problems.length > 0) {
		throw new Error("Could not cast invalid ballot:\n\t" + problems.join("\n\t"));
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
	var allOptions = Object.keys(this.optionsVotedFor);
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
	var ballot = new RankedBallot(slice.call(arguments, 1));
	this.cast(ballot, times);
};

Vote.prototype.approve = function(times) {
	var ballot = new RankedBallot([slice.call(arguments, 1)]);
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

Vote.Restrictions = Restrictions;
Vote.BallotTransforms = BallotTransforms;

module.exports = Vote;