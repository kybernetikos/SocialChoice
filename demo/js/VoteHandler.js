var VoteHandler = function(voterHandler) {
	this.voterHandler = voterHandler;
	this.votes = ko.observableArray([]);
	this.addVote("Firefly");
	this.addVote("Buffy");
	this.addVote("Angel");
}

VoteHandler.prototype.addVote = function(voteName) {
	this.voterHandler.addVote(voteName);
	this.votes.push(voteName);
}

VoteHandler.prototype.getVotes = function() {
	return this.votes();
}