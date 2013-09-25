describe('In a four way ranked race taken from the wikipedia example', function() {
	var global = (function() {return this;})();
	var SocialChoice = global.SocialChoice || require("..");

	var d = new SocialChoice("memphis", "nashville", "knoxville", "chattanooga");

	d.voteRank(42, "memphis", "nashville", "chattanooga", "knoxville");
	d.voteRank(26, "nashville", "chattanooga", "knoxville", "memphis");
	d.voteRank(15, "chattanooga", "knoxville", "nashville", "memphis");
	d.voteRank(17, "knoxville", "chattanooga", "nashville", "memphis");

	it('finds the correct result with ranked pairs.', function() {
		var result = d.ranking().rankedPairs();

		expect(result[0]).toContain("nashville");
		expect(result[1]).toContain("chattanooga");
		expect(result[2]).toContain("knoxville");
		expect(result[3]).toContain("memphis");
	});

	it('finds the correct (silly) result with plurality.', function() {
		var irv = d.instantRunoff();

		expect(irv.pluralityWinner).toContain("memphis");
	});

	it('finds the correct winner with irv.', function() {
		var irv = d.instantRunoff();

		var result = irv.result;
		expect(result[0]).toContain("knoxville");
	})

});