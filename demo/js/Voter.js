var Voter = function(voterName) {
	this.optionText = voterName;
	this.votes = ko.observableArray([]);
}

Voter.prototype.setVotes = function(voteArray) {
	voteArray.forEach(function(vote) {
		this.addVote(vote);
	}.bind(this))
}

Voter.prototype.addVote = function(voteName) {
	this.votes.push({optionText: voteName});
}