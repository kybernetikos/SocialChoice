// 2013-09-26T22:05:18.000Z
// SocialChoice v0.0.1 in a self-contained file, suitable for the browser.

(function(name, definition) {
	if (typeof define === "function") {
		// my own definition function.
		define(name, definition);
	} else if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
		// node style commonJS.
		module.exports = definition();
	} else {
		// setting a global, as in e.g. a browser.
		this[name] = definition();
	}
})('SocialChoice', function() {
	// This is an implementation of require/define that works in a browser assuming all required modules
	// have been defined within the browser *before* any requires are done.
	
	var global = (function() {return this;})();
	var topLevelRequire = global['require'] || function(moduleName) {
		return global[moduleName];
	};
	
	function derelativise(context, path) {
		var result = (context === "" || path.charAt(0) !== '.') ? [] : context.split("/");
		var working = path.split("/");
		var item;
		while (item = working.shift()) {
			if (item === "..") {
				result.pop();
			} else if (item !== ".") {
				result.push(item);
			}
		}
		return result.join("/");
	}
	
	function realm() {
		var moduleDefinitions = {};
		var incompleteExports = {};
		var moduleExports = {};
	
		function define(id, definition) {
			if (id in moduleDefinitions) {
				throw new Error('Module ' + id + ' has already been defined.');
			}
			moduleDefinitions[id] = definition;
		}
		function require(context, id) {
			if (id.substring(0, 2) !== './' && id.substring(0, 3) !== '../') {
				return topLevelRequire.apply(null, Array.prototype.slice.call(arguments, 1));
			}
			id = derelativise(context, id);
			if (moduleExports[id] != null) { return moduleExports[id]; }
			if (incompleteExports[id] != null) {
				// there is a circular dependency, we do the best we can in the circumstances.
				return incompleteExports[id].exports;
			}
			var definition = moduleDefinitions[id];
			if (definition == null) { throw new Error("No definition for module " + id + " has been loaded."); }
			var module = { exports: {} };
			Object.defineProperty(module, 'id', {
				value: id, configurable: false, writable: false, enumerable: true
			});
			incompleteExports[id] = module;
			var definitionContext = id.substring(0, id.lastIndexOf("/"));
			var returnValue = definition.call(module, require.bind(null, definitionContext), module.exports, module);
			moduleExports[id] = returnValue || module.exports;
			delete incompleteExports[id];
			return moduleExports[id];
		}
		require.modules = moduleExports;
		return { define: define, require: require };
	}
	
	var libraryRealm = realm();
	var define = libraryRealm.define;
	var require = libraryRealm.require.bind(null, "");

	// BallotTransforms.js (modified 08:08:52)
	define('SocialChoice/lib/BallotTransforms', function(require, exports, module) {
		var RankedBallot = require('./RankedBallot');
		var ScoredBallot = require('./ScoredBallot');
		var Group = require('./Group');
		
		// Fills in any missing choices, placing them joint last rank for a ranked ballot or giving them
		// a score of 0 for a scored ballot.
		exports.missing = function missing(config, ballot, vote) {
			var allOptions = vote.allOptions();
			var missingOptions = [];
			for (var i = 0; i < allOptions.length; ++i) {
				var option = allOptions[i];
				if (ballot.rankedOptions.indexOf(option) < 0) {
					missingOptions.push(option);
				}
			}
		
			if (missingOptions.length === 0) {
				return ballot;
			}
		
			if (ballot instanceof ScoredBallot === false && ballot instanceof RankedBallot) {
				var missingOptionsRank = config.missingOptionsRank;
				var rankings = ballot.ranks.slice();
				if (missingOptionsRank == null) {
					rankings.push(missingOptions);
				} else {
					rankings.splice(missingOptionsRank, 0, missingOptions);
				}
				return new RankedBallot(rankings);
			} else if (ballot instanceof ScoredBallot) {
				var scoreCard = {};
				for (var key in ballot.scoreCard) {
					scoreCard[key] = ballot.scoreCard[key];
				}
				var missingScore = config.missingOptionsScore || 0;
				for (var i = 0; i < missingOptions.length; ++i) {
					scoreCard[missingOptions[i]] = missingScore;
				}
				return new ScoredBallot(scoreCard);
			}
			throw new Error("Ballot not of a known type.");
		};
		
		// Makes ranked ballots into scored ballots according to a configurable scheme.
		exports.borda = function borda(scoreFromRank) {
			scoreFromRank = scoreFromRank || function(rank, config, ballot, vote) {
				// this is a modified borda count scheme
				return (ballot.ranks.length - 1) - rank;
			};
		
			return function(config, ballot, vote) {
				if (ballot instanceof RankedBallot) {
					var scoreCard = {};
					for (var i = 0; i < ballot.ranks.length; ++i) {
						Group.forEach(ballot.ranks[i], function(option) {
							scoreCard[option] = scoreFromRank(i, config, ballot, vote);
						});
					}
					return new ScoredBallot(scoreCard);
				}
				return ballot;
			}
		};
	});
	
	// Group.js (modified 08:02:08)
	define('SocialChoice/lib/Group', function(require, exports, module) {
		var Group = exports;
		
		Group.forEach = function(thing, func) {
			if (Array.isArray(thing)) {
				thing.forEach(func);
			} else {
				func(thing);
			}
		};
		
		Group.is = function(thing, test) {
			if (Array.isArray(test)) {
				if (test.length === 1) {
					return thing === test[0];
				}
				if (thing.length !== test.length) {
					return false;
				}
				for (var i = 0; i < test.length; ++i) {
					if (test[i] !== thing[i]) {
						return false;
					}
				}
				return true;
			} else {
				return thing === test || (Array.isArray(thing) && thing.length === 1 && thing[0] === test);
			}
		};
		
		Group.flatten = function(array, result) {
			result = result || [];
			for (var i = 0; i < array.length; ++i) {
				if (Array.isArray(array[i])) {
					Group.flatten(array[i], result);
				} else {
					result.push(array[i]);
				}
			}
			return result;
		};
		
		Group.count = function count(array) {
			var result = 0;
			for (var i = 0; i < array.length; ++i) {
				result += Group.size(array[i]);
			}
			return result;
		};
		
		Group.size = function(thing) {
			if (Array.isArray(thing)) {
				return thing.length;
			} else {
				return 1;
			}
		};
		
		Group.filter = function(arg, filterFunc) {
			if (Array.isArray(arg)) {
				var result = [];
				arg.forEach(function(value) {
					var filteredVal = Group.filter(value, filterFunc);
					if (filteredVal !== undefined) {
						result.push(filteredVal);
					}
				});
				if (result.length > 0) {
					return result;
				}
				return undefined;
			} else {
				if (filterFunc(arg)) {
					return arg;
				}
				return undefined;
			}
		};
	});
	
	// main.js (modified 22:57:40)
	define('SocialChoice/lib/main', function(require, exports, module) {
		var Vote = require('./Vote');
		var BallotTransforms = require('./BallotTransforms');
		var Restrictions = require('./Restrictions');
		
		var vote = new Vote({
			options: ["firefly", "buffy", "angel"]
		});
		
		vote.rank(1, "firefly", "buffy", "angel");
		vote.rank(1, "firefly", "angel", "buffy");
		
		var r = vote.getRankingResult();
		
		console.log(r.rankedPairs());
		
		
		/*
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
				*/
	});
	
	// RankedBallot.js (modified 21:02:24)
	define('SocialChoice/lib/RankedBallot', function(require, exports, module) {
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
	});
	
	// Restrictions.js (modified 19:23:07)
	define('SocialChoice/lib/Restrictions', function(require, exports, module) {
		var ScoredBallot = require('./ScoredBallot');
		
		// Disallows any ballot that specifies an option not in the config.
		exports.noWriteIns = function noWriteIns(problems, config, ballot) {
			var isValid = true;
			var values = config.options || [];
			for (var i = 0; i < ballot.rankedOptions.length; ++i) {
				if (values.indexOf(ballot.rankedOptions[i]) < 0) {
					problems.push("Unable to cast a vote for "+ballot.rankedOptions[i]+" as it is not one of the allowed options "+values.join(", "));
					isValid = false;
				}
			}
			return isValid;
		};
		
		// Disallows any ballot that doesn't specify rankings/scores for at least number options.
		exports.selectAtLeast = function selectAtLeast(number) {
			return function(problems, config, ballot) {
				var isValid = true;
				var n = number || config.options.length;
				if (ballot.rankedOptions.length < n) {
					problems.push("You voted for "+ballot.rankedOptions.length+" but valid ballots must have at least "+n+" selections.");
					isValid = false;
				}
				return isValid;
			};
		};
		
		// Disallows any ballot that specifies more than number options ('truncated ballot').
		exports.selectAtMost = function selectAtMost(number) {
			return function(problems, config, ballot) {
				var isValid = true;
				var n = number || config.options.length;
				if (ballot.rankedOptions.length > n) {
					problems.push("You voted for "+ballot.rankedOptions.length+" but valid ballots must have at most "+n+" selections.");
					isValid = false;
				}
				return isValid;
			};
		};
		
		// Disallows any ballot that doesn't specify exactly number options.
		// selectExactly(1), is a restriction that will only allow you to cast ballots for a single
		// candidate.  This is like a FPTP election.
		exports.selectExactly = function selectExactly(number) {
			return function(problems, config, ballot) {
				var isValid = true;
				var n = number || config.options.length;
				if (ballot.rankedOptions.length !== n) {
					problems.push("You voted for "+ballot.rankedOptions.length+" but valid ballots must have exactly "+n+" selections.");
					isValid = false;
				}
				return isValid;
			};
		};
		
		exports.scoreInRange = function scoreInRange(min, max) {
			return function(problems, config, ballot) {
				var isValid = true;
				if (ballot instanceof ScoredBallot) {
					var mn = min || 0;
					var mx = max || 100;
		
					if (ballot.minScore !== null && ballot.minScore < mn) {
						problems.push("Cannot submit a ballot with a minimum score less than "+mn+", was "+ballot.minScore);
						isValid = false;
					}
		
					if (ballot.maxScore !== null && ballot.maxScore > mx) {
						problems.push("Cannot submit a ballot with a maximum score more than "+mx+", was "+ballot.maxScore);
						isValid = false;
					}
				}
				return isValid;
			}
		};
	});
	
	// result\AcyclicPathMatrix.js (modified 18:41:49)
	define('SocialChoice/lib/result/AcyclicPathMatrix', function(require, exports, module) {
		var Matrix = require('./Matrix');
		
		function AcyclicPathMatrix(options) {
			Matrix.call(this, options);
		}
		
		AcyclicPathMatrix.prototype = Object.create(Matrix.prototype, {
			constructor: {value: AcyclicPathMatrix}
		});
		
		AcyclicPathMatrix.prototype.set = function(xOption, yOption, value) {
			var winner = this.choicesMap[xOption];
			var loser = this.choicesMap[yOption];
			if (value < 0) {
				winner = loser;
				loser = this.choicesMap[xOption];
			}
			var winRow = this.matrix[winner];
			var loseRow = this.matrix[loser];
		
			var rowsTheLoserBeats = [];
			for (var i = 0; i < loseRow.length; ++i) {
				if (loseRow[i] > 0) {
					if (winRow[i] < 0) {
						// there's a cycle
						return false;
					}
					rowsTheLoserBeats.push(i);
				}
			}
		
			var rowsTheWinnerLosesTo = [];
			for (var i = 0; i < winRow.length; ++i) {
				if (winRow[i] < 0) {
					if (loseRow[i] > 0) {
						// there's a cycle
						return false;
					}
					rowsTheWinnerLosesTo.push(i);
				}
			}
		
			var j;
			winRow[loser] = 1;
			loseRow[winner] = -1;
			for (j = 0; j < rowsTheWinnerLosesTo.length; ++j) {
				loseRow[rowsTheWinnerLosesTo[j]] = -1;
				this.matrix[rowsTheWinnerLosesTo[j]][loser] = 1;
			}
			for (j = 0; j < rowsTheLoserBeats.length; ++j) {
				winRow[rowsTheLoserBeats[j]] = 1;
				this.matrix[rowsTheLoserBeats[j]][winner] = -1;
			}
			return true;
		};
		
		module.exports = AcyclicPathMatrix;
	});
	
	// result\Bag.js (modified 21:41:49)
	define('SocialChoice/lib/result/Bag', function(require, exports, module) {
		var Util = require('../Util');
		
		function Bag() {
			this.values = [];
			this.counts = [];
			this.length = 0;
			this.total = 0;
		}
		
		Bag.prototype.add = function(value, count) {
			count = count || 1;
			var index = Util.binarySearch(this.values, value);
			if (index >= 0) {
				this.counts[index] += count;
			} else {
				var insertionIndex = -1 - index;
				this.values.splice(insertionIndex, 0, value);
				this.counts.splice(insertionIndex, 0, count);
			}
			this.length += count;
			this.total += value * count;
		};
		
		Bag.prototype.get = function(index) {
			var realPosition = 0;
			while (index >= 0) {
				index -= this.counts[realPosition++];
			}
			return this.values[realPosition - 1];
		};
		
		Bag.prototype.min = function() {
			return this.values[0];
		};
		
		Bag.prototype.max = function() {
			return this.values[this.values.length - 1];
		};
		
		Bag.prototype.mode = function() {
			var indexes = Util.indexSort(this.counts);
			// this will choose one at random if there are multiple modes.
			return this.values[indexes[0]];
		};
		
		Bag.prototype.mean = function() {
			return this.total / this.length;
		};
		
		Bag.prototype.median = function() {
			var midPoint = (this.length / 2) - 0.5;
			if (midPoint !== (midPoint|0)) {
				var a = this.get(midPoint|0);
				var b = this.get((midPoint|0) + 1);
				return (a + b) / 2;
			}
			return this.get(midPoint);
		};
		
		module.exports = Bag;
	});
	
	// result\ImaginaryContest.js (modified 23:03:25)
	define('SocialChoice/lib/result/ImaginaryContest', function(require, exports, module) {
		function ImaginaryContest(baseMatrix, x, y) {
			this.baseMatrix = baseMatrix;
			this.x = x;
			this.y = y;
		}
		
		ImaginaryContest.prototype.winner = function() {
			return (this.baseMatrix.get(this.x, this.y) > this.baseMatrix.get(this.y, this.x)) ? this.x : this.y;
		};
		
		ImaginaryContest.prototype.loser = function() {
			return (this.baseMatrix.get(this.x, this.y) <= this.baseMatrix.get(this.y, this.x)) ? this.x : this.y;
		};
		
		ImaginaryContest.prototype.isDraw = function() {
			return (this.baseMatrix.get(this.x, this.y) === this.baseMatrix.get(this.y, this.x));
		};
		
		ImaginaryContest.prototype.victoryMargin = function() {
			var forX = this.baseMatrix.get(this.x, this.y);
			var forY = this.baseMatrix.get(this.y, this.x);
			return Math.abs(forX - forY);
		};
		
		ImaginaryContest.prototype.voteCount = function() {
			return this.baseMatrix.get(this.x, this.y) + this.baseMatrix.get(this.y, this.x);
		};
		
		ImaginaryContest.prototype.victorVoteCount = function() {
			return Math.max(this.baseMatrix.get(this.x, this.y), this.baseMatrix.get(this.y, this.x));
		};
		
		ImaginaryContest.prototype.loserVoteCount = function() {
			return Math.min(this.baseMatrix.get(this.x, this.y), this.baseMatrix.get(this.y, this.x));
		};
		
		ImaginaryContest.prototype.toString = function() {
			return this.winner() + " beats "+ this.loser();
		};
		
		module.exports = ImaginaryContest;
	});
	
	// result\Matrix.js (modified 18:35:23)
	define('SocialChoice/lib/result/Matrix', function(require, exports, module) {
		var Util = require('../Util');
		var squareArray = Util.squareArray, toMap = Util.toMap, range = Util.range;
		
		function Matrix(options) {
			this.options = options;
			this.matrix = squareArray(options.length);
			this.choicesMap = toMap(options, range(options.length));
		}
		
		Matrix.prototype.set = function(xOption, yOption, value) {
			this.matrix[this.choicesMap[xOption]][this.choicesMap[yOption]] = value;
		};
		
		Matrix.prototype.get = function(xOption, yOption) {
			return this.matrix[this.choicesMap[xOption]][this.choicesMap[yOption]];
		};
		
		Matrix.prototype.increment = function(xOption, yOption, value) {
			var previousValue = this.get(xOption, yOption);
			this.set(xOption, yOption, previousValue + value);
		};
		
		Matrix.prototype._rowTotals = function() {
			return this.matrix.map(function(row) {
				return row.reduce(function(accumulator, value) {
					if (accumulator[value] === undefined) {
						accumulator[value] = 0;
					}
					accumulator[value]++;
					return accumulator;
				}, {});
			});
		};
		
		module.exports = Matrix;
	});
	
	// result\PluralityResult.js (modified 18:23:54)
	define('SocialChoice/lib/result/PluralityResult', function(require, exports, module) {
		var Util = require('../Util');
		var Group = require('../Group');
		
		var EMPTY_ARRAY = [];
		
		function frontRunnerScores(vote, excluded) {
			excluded = excluded || EMPTY_ARRAY;
			var frontRunnerCount = {};
		
			var allOptions = vote.allOptions();
			allOptions.forEach(function(option) {
				if (excluded.indexOf(option) < 0) {
					frontRunnerCount[option] = 0;
				}
			});
		
			vote.forEachBallot(function(ballot, voteCount) {
				var winner = Group.filter(ballot.ranks, Util.notIn(excluded))[0];
				if (winner !== undefined) {
					Group.forEach(winner, function(value) {
						frontRunnerCount[value] += voteCount;
					});
				}
			});
			return frontRunnerCount;
		}
		
		function PluralityResult(vote) {
			this.voteCount = frontRunnerScores(vote);
			this.ranks = Util.rankScoreCard(this.voteCount);
			this.options = Group.flatten(this.ranks);
			this.winner = this.ranks[0];
		}
		
		PluralityResult.frontRunnerScores = frontRunnerScores;
		
		module.exports = PluralityResult;
	});
	
	// result\RankingResult.js (modified 23:05:18)
	define('SocialChoice/lib/result/RankingResult', function(require, exports, module) {
		var AcyclicPathMatrix = require('./AcyclicPathMatrix');
		var Matrix = require('./Matrix');
		var ImaginaryContest = require('./ImaginaryContest');
		var Group = require('../Group');
		var Util = require('../Util');
		
		function RankingResult(vote) {
			this.vote = vote;
			this.choices = vote.allOptions();
		
			this.voteMatrix = new Matrix(this.choices);
			this.imaginaryContests = [];
			for (var i = 0; i < this.choices.length; ++i) {
				for (var j = i + 1; j < this.choices.length; ++j) {
					this.imaginaryContests.push(new ImaginaryContest(this.voteMatrix, this.choices[i], this.choices[j]));
				}
			}
		
			vote.forEachBallot(function(ballot, voteCount) {
				var rankedSets = ballot.ranks;
				var voteMatrix = this.voteMatrix;
				for (var i = 0; i < rankedSets.length; ++i) {
					for (var j = i + 1; j < rankedSets.length; ++j) {
						Group.forEach(rankedSets[i], function(preferred) {
							Group.forEach(rankedSets[j], function(lessPreferred) {
								voteMatrix.increment(preferred, lessPreferred, voteCount);
							});
						});
					}
				}
			}.bind(this));
		}
		
		RankingResult.prototype.rankedPairs = function(contestImportanceFunction) {
			contestImportanceFunction = contestImportanceFunction || function(contest, vote) {
				// this mainly considers the victory margin, but uses the number of votes for the victor
				// as a tie break.
				return contest.victoryMargin() + (contest.victorVoteCount() / vote.voters);
			};
		
			var vote = this.vote;
			var paths = new AcyclicPathMatrix(this.choices);
		
			this.imaginaryContests.filter(function(contest) {
				return contestImportanceFunction(contest, vote) > 0;
			}).sort(function(a, b) {
				return contestImportanceFunction(b, vote) - contestImportanceFunction(a, vote);
			}).forEach(function(contest) {
				if (contest.isDraw() === false) {
					paths.set(contest.winner(), contest.loser(), 1);
				}
			});
		
			// ranking goes from least transitive defeats to most transitive defeats.
			var totals = paths._rowTotals().map(function(rowTotals) {
				return rowTotals["-1"] || 0;
			});
		
			return Util.order(this.choices, totals).reverse();
		};
		
		module.exports = RankingResult;
	});
	
	// result\RunOffResult.js (modified 18:24:23)
	define('SocialChoice/lib/result/RunOffResult', function(require, exports, module) {
		var Util = require('../Util');
		var Group = require('../Group');
		
		var PluralityResult = require('./PluralityResult');
		
		function RunOffResult(vote) {
			var eliminations = [];
		
			var voteCount = PluralityResult.frontRunnerScores(vote);
			var ranks = Util.rankScoreCard(voteCount);
		
			while (ranks.length > 1) {
				var lastItems = ranks[ranks.length - 1];
				eliminations.push(lastItems);
		
				voteCount = PluralityResult.frontRunnerScores(vote, Group.flatten(eliminations));
				ranks = Util.rankScoreCard(voteCount);
			}
		
			var result = eliminations.slice().reverse();
			if (ranks.length > 0) {
				result.unshift(ranks[0]);
			}
		
			this.ranks = result;
			this.winner = result[0];
			this.options = Group.flatten(result);
		};
		
		module.exports = RunOffResult;
	});
	
	// result\SumResult.js (modified 21:36:54)
	define('SocialChoice/lib/result/SumResult', function(require, exports, module) {
		var Util = require('../Util');
		var Bag = require('./Bag');
		var ScoredBallot = require('../ScoredBallot');
		
		function SumResult(vote) {
			var overallScoreCard = {};
			vote.forEachBallot(function(ballot, count) {
				if (ballot instanceof ScoredBallot === false) {
					throw new Error("Cannot calculate the sum for ballots without scores. Consider adding a borda transform.");
				}
				for (var option in ballot.scoreCard) {
					if (overallScoreCard[option] === undefined) {
						overallScoreCard[option] = new Bag();
					}
					overallScoreCard[option].add(ballot.scoreCard[option], count);
				}
			});
		
			this.overallScoreCard = overallScoreCard;
			this.options = Object.keys(overallScoreCard);
		
			this.ranks = Util.rankScoreCard(overallScoreCard, function(stat) {
				return stat.total;
			});
			this.winner = this.ranks[0];
			this.medianRanks = Util.rankScoreCard(overallScoreCard, function(stat) {
				return stat.median();
			});
			this.meanRanks = Util.rankScoreCard(overallScoreCard, function(stat) {
				return stat.mean();
			});
		
		
		}
		
		module.exports = SumResult;
	});
	
	// ScoredBallot.js (modified 08:46:43)
	define('SocialChoice/lib/ScoredBallot', function(require, exports, module) {
		var RankedBallot = require('./RankedBallot');
		var Util = require('./Util');
		
		function ScoredBallot(scoreCard) {
			this.scoreCard = scoreCard;
		
			var scoredKeys = Object.keys(scoreCard).sort();
			var scores = scoredKeys.map(function(key) {return scoreCard[key];});
		
			RankedBallot.call(this, Util.order(scoredKeys, scores));
		
			var sortedScoreIndex = Util.indexSort(scores);
			this.minScore = scores[sortedScoreIndex[sortedScoreIndex.length - 1]];
			this.maxScore = scores[sortedScoreIndex[0]];
			this.count = scoredKeys.length;
		
			this.hashkey = sortedScoreIndex.map(function(value) {
				return scoredKeys[value]+":"+scores[value];
			}).join(",");
		}
		
		ScoredBallot.prototype = Object.create(RankedBallot.prototype, {
			constructor: {value: ScoredBallot}
		});
		
		module.exports = ScoredBallot;
	});
	
	// Util.js (modified 20:51:07)
	define('SocialChoice/lib/Util', function(require, exports, module) {
		var Group = require('./Group');
		
		var Util = exports;
		
		function order(dataArray, scoreArray) {
			var result = [];
			var indexArray = indexSort(scoreArray);
			var currentGroup = [];
			var currentScore = scoreArray[indexArray[0]];
			for (var i = 0; i < indexArray.length; ++i) {
				if (scoreArray[indexArray[i]] !== currentScore) {
					result.push(currentGroup);
					currentGroup = [];
					currentScore = scoreArray[indexArray[i]];
				}
				currentGroup.push(dataArray[indexArray[i]]);
			}
			if (currentGroup.length > 0) {
				result.push(currentGroup);
			}
			return result;
		}
		Util.order = order;
		
		function rankScoreCard(scoreCard, valueFunction) {
			valueFunction = valueFunction || function(obj) {
				return obj.valueOf();
			};
			var scoredKeys = Object.keys(scoreCard).sort();
			var scores = scoredKeys.map(function(key) {return valueFunction(scoreCard[key]);});
			return Util.order(scoredKeys, scores);
		}
		Util.rankScoreCard = rankScoreCard;
		
		function invertRankingArray(rankingArray) {
			var result = {};
			for (var i = 0; i < rankingArray.length; ++i) {
				Group.forEach(rankingArray[i], function(value) {
					result[value] = i;
				});
			}
			return result;
		}
		Util.invertRankingArray = invertRankingArray;
		
		function range(to) {
			var result = [];
			for (var i = 0; i < to; ++i) {
				result[i] = i;
			}
			return result;
		}
		Util.range = range;
		
		function zero() {
			return 0;
		}
		Util.zero = zero;
		
		function indexSort(array) {
			var result = range(array.length);
			result.sort(function(a, b) {
				return array[b] - array[a];
			});
			return result;
		}
		Util.indexSort = indexSort;
		
		function squareArray(size) {
			var matrix = new Array(size);
			for (var i = 0; i < size; ++i) {
				matrix[i] = new Array(size);
				for (var j = 0; j < size; ++j) {
					matrix[i][j] = 0;
				}
			}
			return matrix;
		}
		Util.squareArray = squareArray;
		
		function toMap(keys, values) {
			var result = {};
			for (var i = 0; i < keys.length; ++i) {
				result[keys[i]] = values[i];
			}
			return result;
		}
		Util.toMap = toMap;
		
		function notIn(array) {
			var excludedValues = array.slice();
			return function(value) {
				return excludedValues.indexOf(value) < 0;
			};
		}
		Util.notIn = notIn;
		
		function binarySearch(sortedArray, value) {
			var minPt = 0;
			var maxPt = sortedArray.length - 1;
			while (maxPt >= minPt) {
				var midPt = Math.floor(minPt + (maxPt - minPt) / 2);
				var midValue = sortedArray[midPt];
				if (midValue > value) {
					maxPt = midPt - 1;
				} else if (midValue < value) {
					minPt = midPt + 1;
				} else {
					return midPt;
				}
			}
			// minPt is the correct insertion point.
			return -1 - minPt;
		};
		Util.binarySearch = binarySearch;
	});
	
	// Vote.js (modified 22:13:26)
	define('SocialChoice/lib/Vote', function(require, exports, module) {
		var RankedBallot = require('./RankedBallot');
		var ScoredBallot = require('./ScoredBallot');
		
		var SumResult = require('./result/SumResult');
		var PluralityResult = require('./result/PluralityResult');
		var RunOffResult = require('./result/RunOffResult');
		var RankingResult = require('./result/RankingResult');
		
		var Restrictions = require('./Restrictions');
		var BallotTransforms = require('./BallotTransforms');
		
		var slice = Array.prototype.slice;
		var push = Array.prototype.push;
		
		function Vote(config) {
			this.votingHasCommenced = false;
			this.restrictions = [];
			this.ballotTransforms = [];
			this.ballots = {};
			this.voteCount = {};
			this.voters = 0;
			this.config = config || {};
			this.optionsVotedFor = {};
		
			var restrictions = this.config.restrict || (this.config.options ? [Restrictions.noWriteIns] : []);
			this.setRestrictions.apply(this, restrictions);
		
			var transforms = (this.config.transform) || [BallotTransforms.missing];
			this.setTransforms.apply(this, transforms);
		}
		
		Vote.prototype.setTransforms = function(transform) {
			this.ballotTransforms = [];
			this.addTransform.apply(this, arguments);
		};
		
		Vote.prototype.addTransform = function(transform) {
			push.apply(this.ballotTransforms, arguments);
		};
		
		Vote.prototype.setRestrictions = function(restriction) {
			this.restrictions = [];
			this.restrict.apply(this, arguments);
		}
		Vote.prototype.restrict = function(restriction) {
			if (this.votingHasCommenced === true) {
				throw new Error("Voting has already commenced.");
			}
			push.apply(this.restrictions, arguments);
		};
		
		Vote.prototype.check = function(ballot) {
			var problems = [];
			for (var i = 0; i < this.restrictions.length; ++i) {
				this.restrictions[i](problems, this.config, ballot);
			}
			return problems;
		};
		
		Vote.prototype.cast = function(ballot, times) {
			times = times || 1;
			var problems = this.check(ballot);
			if (problems.length > 0) {
				throw new Error("Could not cast invalid ballot:\n\t" + problems.join("\n\t"));
			}
			this.votingHasCommenced = true;
			if (this.ballots[ballot.hashkey] === undefined) {
				this.ballots[ballot.hashkey] = ballot;
				this.voteCount[ballot.hashkey] = 0;
			}
			for (var i = 0; i < ballot.rankedOptions.length; ++i) {
				this.optionsVotedFor[ballot.rankedOptions[i]] = true;
			}
			this.voteCount[ballot.hashkey] += times;
			this.voters += times;
		};
		
		Vote.prototype.forEachBallot = function(func) {
			for (var key in this.ballots) {
				var ballot = this.ballots[key];
				for (var i = 0; i < this.ballotTransforms.length; ++i) {
					ballot = this.ballotTransforms[i](this.config, ballot, this);
				}
				var voteCount = this.voteCount[key];
				func(ballot, voteCount);
			}
		};
		
		Vote.prototype.allOptions = function() {
			var allOptions = Object.keys(this.optionsVotedFor);
			var config = this.config;
			if (config.options) {
				for (var i = 0; i < config.options.length; ++i) {
					if (allOptions.indexOf(config.options[i]) < 0) {
						allOptions.push(config.options[i]);
					}
				}
			}
			return allOptions;
		}
		
		Vote.prototype.rank = function(times) {
			var ballot = new RankedBallot(slice.call(arguments, 1));
			this.cast(ballot, times);
		};
		
		Vote.prototype.approve = function(times) {
			var ballot = new RankedBallot([slice.call(arguments, 1)]);
			this.cast(ballot, times);
		};
		
		Vote.prototype.score = function(times, scoreCard) {
			var ballot = new ScoredBallot(scoreCard);
			this.cast(ballot, times);
		};
		
		Vote.prototype.getSumResult = function() {
			return new SumResult(this);
		};
		
		Vote.prototype.getPluralityResult = function() {
			return new PluralityResult(this);
		};
		
		Vote.prototype.getRunOffResult = function() {
			return new RunOffResult(this);
		};
		
		Vote.prototype.getRankingResult = function() {
			return new RankingResult(this);
		};
		
		Vote.Restrictions = Restrictions;
		Vote.BallotTransforms = BallotTransforms;
		
		module.exports = Vote;
	});
	return require('./SocialChoice/lib/Vote');
});