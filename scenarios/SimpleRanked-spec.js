describe('In a four way ranked race with a clear winner', function() {
	var global = (function() {return this;})();
	var SocialChoice = global.SocialChoice || require("..");

	var d = new SocialChoice("a", "b", "c", "d");

	d.voteRank(10, "a", "b", "c");
	d.voteRank(4, "b", "c");
	d.voteRank(2, "d", "c", "a");
	d.voteRank(19, "a", "c", "b", "d");

	it('finds the correct result with ranked pairs.', function() {
		var result = d.ranking().rankedPairs();

		expect(result[0]).toContain("a");
		expect(result[1]).toContain("c");
		expect(result[2]).toContain("b");
		expect(result[3]).toContain("d");
	});

	it('finds the correct result with plurality.', function() {
		var irv = d.instantRunoff();

		expect(irv.pluralityWinner).toContain("a");
	})

});