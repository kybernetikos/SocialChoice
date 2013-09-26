describe('In a four way ranked race taken from the wikipedia example', function() {
	var global = (function() {return this;})();
	var SocialChoice = global.SocialChoice || require("..");

	var d = new SocialChoice({options: ["memphis", "nashville", "knoxville", "chattanooga"]});

	d.rank(42, "memphis", "nashville", "chattanooga", "knoxville");
	d.rank(26, "nashville", "chattanooga", "knoxville", "memphis");
	d.rank(15, "chattanooga", "knoxville", "nashville", "memphis");
	d.rank(17, "knoxville", "chattanooga", "nashville", "memphis");

	it('finds the correct result with ranked pairs.', function() {
		var result = d.getRankingResult().rankedPairs();

		expect(result[0]).toContain("nashville");
		expect(result[1]).toContain("chattanooga");
		expect(result[2]).toContain("knoxville");
		expect(result[3]).toContain("memphis");
	});

	it('finds the correct winner with irv.', function() {
		var irv = d.getRunOffResult();

		var result = irv.ranks;
		expect(result[0]).toContain("knoxville");
	})

});