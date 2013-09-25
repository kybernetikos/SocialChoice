describe('In a four way ranked race with a clear winner', function() {
	var global = (function() {return this;})();
	var SocialChoice = global.SocialChoice || require("..");

	var d = new SocialChoice({options: ["a", "b", "c", "d"]});

	d.rank(10, "a", "b", "c");
	d.rank(4, "b", "c");
	d.rank(2, "d", "c", "a");
	d.rank(19, "a", "c", "b", "d");

	it('finds the correct result with ranked pairs.', function() {
		var result = d.getRankingResult().rankedPairs();

		expect(result[0]).toContain("a");
		expect(result[1]).toContain("c");
		expect(result[2]).toContain("b");
		expect(result[3]).toContain("d");
	});

	it('finds the correct result with plurality.', function() {
		var plurality = d.getPluralityResult();

		expect(plurality.ranks[0]).toContain("a");
	})

});