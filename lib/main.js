var Vote = require('./Vote');
var BallotTransforms = require('./BallotTransforms');
var Restrictions = require('./Restrictions');

var vote = new Vote({
	options: ["c", "b", "a", "d", "e"]
});

vote.addTransform(BallotTransforms.borda());

vote.rank(10, "c", "a");
vote.score(4, {"d": 10, a: 2});
//vote.score(100, {});


console.log(vote.getSumResult());
console.log(vote.getPluralityResult());
var rr = vote.getRankingResult();
console.log(rr.rankedPairs());
console.log(vote.getRunOffResult());