var Voter = function(voterName) {
	this.optionText = voterName;
	this.votes = ko.observableArray([]);
	this.orderedVotes = [];
}

Voter.prototype.setVotes = function(voteArray) {
	voteArray.forEach(function(vote) {
		this.addVote(vote);
	}.bind(this))
}

Voter.prototype.getOrderedVotesArray = function() {
	return this.orderedVotes;
}

Voter.prototype.addVote = function(voteName) {
	this.votes.push({optionText: voteName});
	this.orderedVotes.push(voteName);
}

Voter.prototype.voterUpdatedTheirChoice = function(startPosition, endPosition) {
	var voteMoved = this.orderedVotes.splice(startPosition,1)[0];
	this.orderedVotes.splice(endPosition,0,voteMoved);
}