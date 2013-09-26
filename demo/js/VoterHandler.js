var VoterHandler = function() {
	this.voters = ko.observableArray([]);
	this.voters.push({
		optionText: "Jon Paul",
		votes: ko.observableArray([{optionText: 1}])
	});
	ko.applyBindingsToNode(document.getElementById("sortable"), null, this);
}