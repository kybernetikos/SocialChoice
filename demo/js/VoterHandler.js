var VoterHandler = function() {
	this.voters = ko.observableArray([]);
	this.voters.push();
	ko.applyBindingsToNode(document.getElementById("voter"), null, this);
}

VoterHandler.prototype.setVoteHandler = function(voteHandler) {
	this.voteHandler = voteHandler;
}

VoterHandler.prototype.addVoter = function(voterName) {
	var voter = new Voter(voterName);
	voter.setVotes(this.voteHandler.getVotes());
	this.voters.push(voter);

	this.enableDragOnAllVotes();
}

VoterHandler.prototype.addVoteToAllVoters = function(vote) {
	this.voters().forEach(function(voter) {
		voter.addVote(vote);
	})
}

VoterHandler.prototype.getAllVotes = function() {
	var voters = {};
	this.voters().forEach(function(voter) {
		voters[voter.optionText] = voter.getOrderedVotesArray();
	})
	return voters;
}

VoterHandler.prototype.getAllOptions = function() {
	return this.voteHandler.getVotes();
}

VoterHandler.prototype.enableDragOnAllVotes = function() {
	$(function() {
		$( ".sortable" ).sortable({
			start: function(event, ui) {
				ui.item.data('start_pos', ui.item.index());
			},
			update: function(event, ui) {
				//Window Context
				var startPosition = ui.item.data('start_pos');
				var endPosition = ui.item.index();
				var voterHandler = ko.dataFor(this);
				voterHandler.voterUpdatedTheirChoice(startPosition, endPosition);
			}
		});
		$( ".sortable" ).disableSelection();
	});
}