// 2013-09-26T07:49:00.000Z
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

	// AcyclicPathMatrix.js (modified 07:53:26)
	define('SocialChoice/lib/AcyclicPathMatrix', function(require, exports, module) {
		var MirrorMatrix = require('./MirrorMatrix');
		
		function AcyclicPathMatrix(options) {
			MirrorMatrix.call(this, options);
		}
		
		AcyclicPathMatrix.prototype = Object.create(MirrorMatrix.prototype, {
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
	
	// ImaginaryContest.js (modified 08:02:28)
	define('SocialChoice/lib/ImaginaryContest', function(require, exports, module) {
		function ImaginaryContest(baseMatrix, x, y) {
			this.baseMatrix = baseMatrix;
			this.x = x;
			this.y = y;
		}
		
		ImaginaryContest.prototype.victoryMargin = function() {
			return Math.abs(this.baseMatrix.get(this.x, this.y));
		};
		
		ImaginaryContest.prototype.winner = function() {
			return (this.baseMatrix.get(this.x, this.y) > 0) ? this.x : this.y;
		};
		
		ImaginaryContest.prototype.loser = function() {
			return (this.baseMatrix.get(this.x, this.y) > 0) ? this.y : this.x;
		};
		
		ImaginaryContest.prototype.toString = function() {
			return this.winner() + " beats "+ this.loser();
		};
		
		module.exports = ImaginaryContest;
	});
	
	// main.js (modified 21:32:50)
	define('SocialChoice/lib/main', function(require, exports, module) {
		var Vote = require('./Vote');
		var BallotTransforms = require('./BallotTransforms');
		
		var vote = new Vote({
			options: ["c", "b", "a", "d", "e"]
		});
		
		vote.addTransform(
			BallotTransforms.borda()
		);
		
		vote.rank(10, "c", "a");
		vote.score(4, {"d": 10, a: 2});
		vote.score(100, {});
		
		console.log(vote.getSumResult());
		console.log(vote.getPluralityResult());
		var rr = vote.getRankingResult();
		console.log(rr.rankedPairs());
		console.log(vote.getRunOffResult());
	});
	
	// Matrix.js (modified 08:02:58)
	define('SocialChoice/lib/Matrix', function(require, exports, module) {
		var Util = require('./Util');
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
	
	// MirrorMatrix.js (modified 08:02:58)
	define('SocialChoice/lib/MirrorMatrix', function(require, exports, module) {
		var Matrix = require('./Matrix');
		
		function MirrorMatrix(options) {
			Matrix.call(this, options);
		}
		
		MirrorMatrix.prototype = Object.create(Matrix.prototype, {
			constructor: {value: MirrorMatrix}
		});
		
		MirrorMatrix.prototype.set = function(xOption, yOption, value) {
			var set = Matrix.prototype.set;
			set.call(this, xOption, yOption, value);
			set.call(this, yOption, xOption, -value);
		};
		
		module.exports = MirrorMatrix;
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
	
	// Restrictions.js (modified 08:05:48)
	define('SocialChoice/lib/Restrictions', function(require, exports, module) {
		// Disallows any ballot that specifies an option not in the config.
		exports.noWriteIns = function noWriteIns(config, ballot) {
			var values = config.options || [];
			for (var i = 0; i < ballot.rankedOptions.length; ++i) {
				if (values.indexOf(ballot.rankedOptions[i]) < 0) {
					throw new Error("Unable to cast a vote for "+ballot.rankedOptions[i]+" as it is not one of the allowed options "+values.join(", "));
				}
			}
		};
		
		// Disallows any ballot that doesn't specify rankings/scores for at least number options.
		exports.selectAtLeast = function selectAtLeast(number) {
			return function(config, ballot) {
				var n = number || config.options.length;
				if (ballot.rankedOptions.length < n) {
					throw new Error("You voted for "+ballot.rankedOptions.length+" but valid ballots must have at least "+n+" selections.");
				}
			};
		};
		
		// Disallows any ballot that specifies more than number options ('truncated ballot').
		exports.selectAtMost = function selectAtMost(number) {
			return function(config, ballot) {
				var n = number || config.options.length;
				if (ballot.rankedOptions.length > n) {
					throw new Error("You voted for "+ballot.rankedOptions.length+" but valid ballots must have at most "+n+" selections.");
				}
			};
		};
		
		// Disallows any ballot that doesn't specify exactly number options.
		// selectExactly(1), is a restriction that will only allow you to cast ballots for a single
		// candidate.  This is like a FPTP election.
		exports.selectExactly = function selectExactly(number) {
			return function(config, ballot) {
				var n = number || config.options.length;
				if (ballot.rankedOptions.length !== n) {
					throw new Error("You voted for "+ballot.rankedOptions.length+" but valid ballots must have exactly "+n+" selections.");
				}
			};
		};
	});
	
	// result\PluralityResult.js (modified 08:49:00)
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
		}
		
		PluralityResult.frontRunnerScores = frontRunnerScores;
		
		module.exports = PluralityResult;
	});
	
	// result\RankingResult.js (modified 21:17:43)
	define('SocialChoice/lib/result/RankingResult', function(require, exports, module) {
		var AcyclicPathMatrix = require('../AcyclicPathMatrix');
		var MirrorMatrix = require('../MirrorMatrix');
		var ImaginaryContest = require('../ImaginaryContest');
		var Group = require('../Group');
		var Util = require('../Util');
		
		function RankingResult(vote) {
			this.choices = vote.allOptions();
		
			this.rankingMatrix = new MirrorMatrix(this.choices);
			this.imaginaryContests = [];
			for (var i = 0; i < this.choices.length; ++i) {
				for (var j = i + 1; j < this.choices.length; ++j) {
					this.imaginaryContests.push(new ImaginaryContest(this.rankingMatrix, this.choices[i], this.choices[j]));
				}
			}
		
			vote.forEachBallot(function(ballot, voteCount) {
				var rankedSets = ballot.ranks;
				for (var i = 0; i < rankedSets.length; ++i) {
					for (var j = i + 1; j < rankedSets.length; ++j) {
						this._addPreference(voteCount, rankedSets[i], rankedSets[j]);
					}
				}
			}.bind(this));
		}
		
		RankingResult.prototype._addPreference = function(number, preferred, lessPreferred) {
			var rankMatrix = this.rankingMatrix;
			Group.forEach(preferred, function(preferredValue) {
				Group.forEach(lessPreferred, function(lessPreferredValue) {
					rankMatrix.increment(preferredValue, lessPreferredValue, number);
				});
			});
		};
		
		RankingResult.prototype.rankedPairs = function() {
			var paths = new AcyclicPathMatrix(this.choices);
		
			// TODO: do something not-arbitrary when the contests have equal margins.
			this.imaginaryContests.slice().filter(function(contest) {
				return contest.victoryMargin() > 0;
			}).sort(function(a, b) {
						return b.victoryMargin() - a.victoryMargin();
					}).forEach(function(contest) {
						paths.set(contest.winner(), contest.loser(), 1);
					});
		
			var totals = paths._rowTotals().map(function(rowTotals) {
				return rowTotals["-1"] || 0;
			});
		
			return Util.order(this.choices, totals).reverse();
		};
		
		module.exports = RankingResult;
	});
	
	// result\RunOffResult.js (modified 08:48:21)
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
			this.options = Group.flatten(result);
		};
		
		module.exports = RunOffResult;
	});
	
	// result\SumResult.js (modified 08:41:55)
	define('SocialChoice/lib/result/SumResult', function(require, exports, module) {
		var Util = require('../Util');
		
		function SumResult(vote) {
			var overallScoreCard = {};
			vote.forEachBallot(function(ballot, count) {
				for (var option in ballot.scoreCard) {
					if (overallScoreCard[option] === undefined) {
						overallScoreCard[option] = 0;
					}
					overallScoreCard[option] += ballot.scoreCard[option] * count;
				}
			});
		
			this.overallScoreCard = overallScoreCard;
			this.ranks = Util.rankScoreCard(overallScoreCard);
			this.options = Object.keys(overallScoreCard);
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
	
	// Util.js (modified 08:28:30)
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
		
		function rankScoreCard(scoreCard) {
			var scoredKeys = Object.keys(scoreCard).sort();
			var scores = scoredKeys.map(function(key) {return scoreCard[key];});
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
	});
	
	// Vote.js (modified 08:47:45)
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
		
		Vote.prototype.cast = function(ballot, times) {
			times = times || 1;
			for (var i = 0; i < this.restrictions.length; ++i) {
				this.restrictions[i](this.config, ballot);
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
		Vote.BallotTransforms = require('./BallotTransforms');
		
		module.exports = Vote;
	});
	return require('./SocialChoice/lib/Vote');
});