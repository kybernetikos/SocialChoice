var VoteCounter = function(voterHandler, voteHandler) {
	this.voterHandler = voterHandler;
	this.voteHandler = voteHandler;
    this.voteResult = ko.observable("");
    this.selectedVotingType = ko.observable("");
    this.voteOptions = ko.observableArray([]);
    this.addVoteOptions();
    ko.applyBindingsToNode(document.getElementById("results"), null, this);
    ko.applyBindingsToNode(document.getElementById("voteType"), null, this);

}

VoteCounter.prototype.addVoteOptions = function() {
    this.voteOptions.push({
        optionsText: "RankedPairs"
    });
}

VoteCounter.prototype.calculateVotes = function() {
	var allVotes = this.voterHandler.getAllVotes();
	var allOptions = this.voteHandler.getVotes();

	var ballotBox = new SocialChoice({
		options: allOptions
	});

	this._addUpEachVote(ballotBox, allVotes);

	var resultsString = ballotBox.getRankingResult().rankedPairs().join(" ");

	this.voteResult(resultsString);
}

VoteCounter.prototype._addUpEachVote = function(ballotBox, allVotes) {
	for (var index in allVotes) {
		var voters = allVotes[index];
		voters.unshift(1);
		SocialChoice.prototype.rank.apply(ballotBox, voters);
		voters.shift(1);
	}
}