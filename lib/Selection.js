var group = require('./Util').order;

function Selection(options, id, scores) {
	if (scores.length !== options.length) {
		throw new Error("Scores must include all options.");
	}
	this.id = id;
	this.scores = scores;
	this.options = options;
}

Selection.prototype.getRankedSets = function() {
	return group(this.options, this.scores);
};

module.exports = Selection;