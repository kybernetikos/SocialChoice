var Group = require('./Group');
var Util = require('./Util');

var slice = Array.prototype.slice;

function RankedBallot(rankings) {
	rankings = slice.call(rankings);
	for (var i = 0; i < rankings.length; i++) {
		if (Array.isArray(rankings[i])) {
			rankings[i] = rankings[i].slice();
			rankings[i].sort();
		}
	}
	this.ranks = rankings;
	this.rankedOptions = Group.flatten(this.ranks);
	this.count = this.rankedOptions.length;
	this.optionToRank = Util.invertRankingArray(rankings);
	this.maxRank = rankings.length - 1;

	this.hashkey = "("+rankings.join("),(")+")";
}

module.exports = RankedBallot;