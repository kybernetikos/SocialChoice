var VoteHandler = function(voterHandler) {
	this.voterHandler = voterHandler;
	this.voterHandler.setVoteHandler(this);
	this.votes = ko.observableArray([]);
}

VoteHandler.prototype.addVote = function(voteName) {
	this.voterHandler.addVoteToAllVoters(voteName);
	this.votes.push(voteName);
}

VoteHandler.prototype.getVotes = function() {
	return this.votes();
}