var VoterHandler = function() {
	this.voters = ko.observableArray([]);
	this.voters.push();
	ko.applyBindingsToNode(document.getElementById("voter"), null, this);

	this.voteHandler = new VoteHandler(this);

	this.addVoter("Adam Iley");
	this.addVoter("Jon Paul");
}

VoterHandler.prototype.addVoter = function(voterName) {
	var voter = new Voter(voterName);
	voter.setVotes(this.voteHandler.getVotes());
	this.voters.push(voter);

	this.enableDragOnAllVotes();
}

VoterHandler.prototype.addVote = function(vote) {
	this.voters().forEach(function(vote) {
		this.addVote(vote);
	}.bind(this))
}

VoterHandler.prototype.enableDragOnAllVotes = function() {
	$(function() {
		$( ".sortable" ).sortable();
		$( ".sortable" ).disableSelection();
	});
}