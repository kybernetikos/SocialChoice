var SelectionFactory = require('./SelectionFactory');
var Util = require('./Util');
var zero = Util.zero;
var Group = require('./Group');
var Summation = require('./Summation');
var Ranking = require('./Ranking');
var InstantRunoff = require('./InstantRunoff');

function Dilemma() {
	this.choices = Array.prototype.slice.call(arguments);
	this.votes = {};
	this.selections = new SelectionFactory(this.choices);
	this.number = 0;
}

Dilemma.prototype._score = function(votes, scores) {
	var selection = this.selections.getSelection.apply(this.selections, scores);
	if (this.votes[selection.id] === undefined) {
		this.votes[selection.id] = 0;
	}
	this.votes[selection.id] += votes;
	this.number += votes;
};

Dilemma.prototype.forEach = function(func) {
	for (var selectionId in this.votes) {
		var votes = this.votes[selectionId];
		var selection = this.selections.getById(selectionId);
		func(votes, selection);
	}
};

Dilemma.prototype.voteRank = function(votes) {
	var score = this.choices.map(zero);

	var bands = arguments.length - 1;
	if (Group.count(arguments) - 1 < score.length) {
		bands += 1;
	}
	var factor = 1 / (bands - 1);

	for (var i = 1; i < arguments.length; ++i) {
		Group.forEach(arguments[i], function(value) {
			score[this.choices.indexOf(value)] = (bands - i) * factor;
		}.bind(this));
	}
	this._score(votes, score);
};

Dilemma.prototype.voteApproval = function(votes) {
	var score = this.choices.map(zero);

	for (var i = 1; i < arguments.length; ++i) {
		Group.forEach(arguments[i], function(value) {
			score[this.choices.indexOf(value)] = 1;
		}.bind(this));
	}
	this._score(votes, score);
};

Dilemma.prototype.votePlurality = function(votes, myChoice) {
	if (arguments.length !== 2) throw new Error("In plurality, you can only vote for one party.");
	if (myChoice instanceof Group && !myChoice.isSingle()) throw new Error("In plurality you can only vote for one party.");
	this.approvalVote(votes, myChoice);
};

Dilemma.prototype.voteRange = function(votes, voteRecord) {
	var score = this.choices.map(zero);
	for (var key in voteRecord) {
		score[this.choices.indexOf(key)] = Math.max(0, Math.min(1, voteRecord[key]));
	}
	this._score(votes, score);
};

Dilemma.prototype.summation = function() {
	return new Summation(this);
};

Dilemma.prototype.ranking = function() {
	return new Ranking(this);
};

Dilemma.prototype.instantRunoff = function() {
	return new InstantRunoff(this);
};

module.exports = Dilemma;