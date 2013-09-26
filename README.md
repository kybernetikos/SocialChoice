---
layout: main
permalink: /index.html
title: SocialChoice
---

<script type="text/javascript" src="target/single/SocialChoice.js"></script>

SocialChoice
============

A playground for exploring vote counting methods.

* This document is available nicely formatted [here](http://kybernetikos.github.io/SocialChoice).
* Tests are [here](http://kybernetikos.github.io/SocialChoice/scenarios).
* Source code is [here](https://github.com/kybernetikos/SocialChoice).
* You can also get it with the following command if you're using node.

    npm install git+http://github.com/kybernetikos/SocialChoice.git#gh-pages

Getting Started
---------------

You can set up an election with the following code:

```javascript

	var SocialChoice = require('SocialChoice');

	var vote = new SocialChoice({
		options: ["a", "b", "c", "d", "x", "y"]
	});

```

Now you can vote for some of the options. Voting can be done by ranking, or by assigning a score.

```javascript

	vote.rank(10, ["a", "x"], "b");
	vote.rank(4, ["a", "x"], ["c", "y"]);
	vote.rank(2, "d", ["a", "x"], ["c", "y"], "b");
	vote.rank(19, ["c", "y"], "b", ["a", "x"]);

	vote.score(4, {
		"a": 3,
		"x": 99
	});

```

You can get various kinds of results:

```javascript

		console.log(vote.getSumResult());

		var r = vote.getRankingResult();
		console.log("ranked pairs", r.rankedPairs().join(" "));

		var i = vote.getRunOffResult();
		console.log("instant run-off", i.ranks.join(" "));

```

The whole system is very flexible and extensible.  You can apply restrictions which check votes are
valid for the particular election you are running, and ballot transforms which can modify votes.

A default restriction (called noWriteIns) is applied when you specify options in your configuration,
which stops votes from ranking things not specified in the configured options.

A common ballot transform used by default (called missing) scores anything not mentioned in a ballot
as 0 or ranks it last.

Some of the result objects have parameters too, for example it's possible to change the way the
ranked pairs algorithm determines which pair-wise contests are most significant by passing a
function parameter.