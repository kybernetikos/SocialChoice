// 2013-09-18T18:46:51.000Z
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

	// AcyclicPathMatrix.js (modified 18:20:27)
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
				value = -value;
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
	
	// Dilemma.js (modified 19:27:38)
	define('SocialChoice/lib/Dilemma', function(require, exports, module) {
		var SelectionFactory = require('./SelectionFactory');
		var Util = require('./Util');
		var countOptions = Util.countOptions, zero = Util.zero;
		var Group = require('./Group');
		var Summation = require('./Summation');
		var Ranking = require('./Ranking');
		var InstantRunoff = require('./InstantRunoff');
		
		function Dilemma() {
			this.choices = Array.prototype.slice.call(arguments);
			this.votes = {};
			this.selections = new SelectionFactory(this.choices);
			this.number = 0;
		}
		
		Dilemma.prototype._score = function(votes, scores) {
			var selection = this.selections.getSelection.apply(this.selections, scores);
			if (this.votes[selection.id] === undefined) {
				this.votes[selection.id] = 0;
			}
			this.votes[selection.id] += votes;
			this.number += votes;
		};
		
		Dilemma.prototype.forEach = function(func) {
			for (var selectionId in this.votes) {
				var votes = this.votes[selectionId];
				var selection = this.selections.getById(selectionId);
				func(votes, selection);
			}
		};
		
		Dilemma.prototype.voteRank = function(votes) {
			var score = this.choices.map(zero);
		
			var bands = arguments.length - 1;
			if (countOptions(arguments) - 1 < score.length) {
				bands += 1;
			}
			var factor = 1 / (bands - 1);
		
			for (var i = 1; i < arguments.length; ++i) {
				Group.forEach(arguments[i], function(value) {
					score[this.choices.indexOf(value)] = (bands - i) * factor;
				}.bind(this));
			}
			this._score(votes, score);
		};
		
		Dilemma.prototype.voteApproval = function(votes) {
			var score = this.choices.map(zero);
		
			for (var i = 1; i < arguments.length; ++i) {
				Group.forEach(arguments[i], function(value) {
					score[this.choices.indexOf(value)] = 1;
				}.bind(this));
			}
			this._score(votes, score);
		};
		
		Dilemma.prototype.votePlurality = function(votes, myChoice) {
			if (arguments.length !== 2) throw new Error("In plurality, you can only vote for one party.");
			if (myChoice instanceof Group && !myChoice.isSingle()) throw new Error("In plurality you can only vote for one party.");
			this.approvalVote(votes, myChoice);
		};
		
		Dilemma.prototype.voteRange = function(votes, voteRecord) {
			var score = this.choices.map(zero);
			for (var key in voteRecord) {
				score[this.choices.indexOf(key)] = Math.max(0, Math.min(1, voteRecord[key]));
			}
			this._score(votes, score);
		};
		
		Dilemma.prototype.summation = function() {
			return new Summation(this);
		};
		
		Dilemma.prototype.ranking = function() {
			return new Ranking(this);
		};
		
		Dilemma.prototype.instantRunoff = function() {
			return new InstantRunoff(this);
		};
		
		module.exports = Dilemma;
	});
	
	// Group.js (modified 18:17:07)
	define('SocialChoice/lib/Group', function(require, exports, module) {
		function Group() {
			var instance = this;
			if (instance instanceof Group === false) {
				instance = new Group();
			}
			instance.values = Array.prototype.slice.call(arguments);
			return instance;
		}
		Group.forEach = function(thing, func) {
			if (thing instanceof Array) {
				return thing.forEach(func);
			} else  if (thing instanceof Group) {
				return thing.values.forEach(func);
			} else {
				func(thing);
			}
		};
		Group.size = function(thing) {
			if (thing instanceof Array) {
				return thing.length;
			} else  if (thing instanceof Group) {
				return thing.values.length;
			} else {
				return 1;
			}
		};
		Group.filter = function(arg, filterFunc) {
			if (arg instanceof Group) {
				return arg.filter(filterFunc);
			} else if (arg instanceof Array) {
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
		Group.prototype.filter = function(filterFunc) {
			var newGroup = new Group();
			newGroup.values = this.values.filter(filterFunc);
			if (newGroup.values.length === 0) return undefined;
			return newGroup;
		}
		Group.prototype.add = function(value) {
			this.values.push(value);
		};
		Group.prototype.addAll = function(otherGroup) {
			this.values.push.apply(this.values, otherGroup.values);
		};
		Group.prototype.contains = function(value) {
			return this.values.indexOf(value) >= 0;
		};
		Group.prototype.isEmpty = function() {
			return this.values.length === 0;
		};
		Group.prototype.isSingle = function() {
			return this.values.length === 1;
		};
		Group.prototype.toString = function() {
			if (this.values.length === 1) {
				return String(this.values[0]);
			}
			return "[" +this.values.join(" ")+ "]";
		};
		Group.prototype.valueOf = function() {
			if (this.values.length === 1) {
				return this.values[0];
			}
		};
		
		module.exports = Group;
	});
	
	// ImaginaryContest.js (modified 18:17:14)
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
	
	// InstantRunoff.js (modified 18:47:51)
	define('SocialChoice/lib/InstantRunoff', function(require, exports, module) {
		var Util = require('./Util');
		var range = Util.range, toMap = Util.toMap, notIn = Util.notIn, indexSort = Util.indexSort, group = Util.order, zero = Util.zero;
		var Group = require('./Group');
		
		function InstantRunoff(dilemma) {
			this.dilemma = dilemma;
		
			var options = dilemma.choices.slice();
			var choicesMap = toMap(options, range(options.length));
			this.pluralityWinner = undefined;
			var excluded = [];
		
			var uniqueValues = {length: 3};
			// TODO: work out the correct victory criteria - normally IRV is considered to run
			// until one candidate has more than 50% of the vote.  This might not work though if
			// there is a genuine three way tie.
			// This victory criteria - continue the run offs until there are two groups with equal scores
			// is pretty different to that.
			while (uniqueValues.length > 2) {
				var scores = options.map(zero);
				dilemma.forEach(function(voteCount, selection) {
					var winner = Group.filter(selection.getRankedSets(), notIn(excluded))[0];
					if (winner !== undefined) {
						Group.forEach(winner, function(value) {
							scores[choicesMap[value]] += voteCount;
						});
					}
				});
				uniqueValues = scores.slice().filter(function(value, index, array) {
					return value !== 0 && array.indexOf(value) === index;
				});
		
				if (this.pluralityWinner === undefined) {
					var groupings = group(options, scores);
					this.pluralityWinner = groupings[0];
				}
		
				var reversedScoreIndexes = indexSort(scores).filter(function(a) {
					return scores[a] > 0;
				}).reverse();
		
				excluded.push(options[reversedScoreIndexes[0]]);
		
			}
			this.result = group(options, scores);
		}
		
		InstantRunoff.prototype.winner = function() {
			return this.result[0];
		};
		
		module.exports = InstantRunoff;
	});
	
	// main.js (modified 18:52:44)
	define('SocialChoice/lib/main', function(require, exports, module) {
		var Dilemma = require('./Dilemma');
		var Summation = require('./Summation');
		var Ranking = require('./Ranking');
		var InstantRunoff = require('./InstantRunoff');
		var Group = require('./Group');
		
		var d = new Dilemma("a", "b", "c", "d", "x", "y");
		d.voteRank(10, Group("a", "x"), "b");
		d.voteRank(4, Group("a", "x"), Group("c", "y"));
		d.voteRank(2, "d", Group("a", "x"), Group("c", "y"), "b");
		d.voteRank(19, Group("c", "y"), "b", Group("a", "x"));
		// d.rangeVote(10, {a: 0.10, b:0.02, c:0.20});
		// d.rangeVote(10, {a: 0.20, b:0, c:0.10, d:0.1});
		
		var s = new Summation(d);
		console.log(s.scoreCard());
		console.log("range", s.result().join("  "));
		console.log("plurality", s.plurality().join(" "));
		
		var r = new Ranking(d);
		console.log("ranked pairs", r.rankedPairs().join(" "));
		
		var i = new InstantRunoff(d);
		console.log("instant run-off", i.winner().toString());
		console.log("runoff plurality", i.pluralityWinner.toString());
	});
	
	// Matrix.js (modified 18:25:06)
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
	
	// MirrorMatrix.js (modified 18:17:56)
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
	
	// Ranking.js (modified 18:26:56)
	define('SocialChoice/lib/Ranking', function(require, exports, module) {
		var MirrorMatrix = require('./MirrorMatrix');
		var ImaginaryContest = require('./ImaginaryContest');
		var Group = require('./Group');
		var AcyclicPathMatrix = require('./AcyclicPathMatrix');
		var group = require('./Util').order;
		
		function Ranking(dilemma) {
			this.dilemma = dilemma;
			this.choices = dilemma.choices.slice();
		
			this.rankingMatrix = new MirrorMatrix(this.choices);
			this.imaginaryContests = [];
			for (var i = 0; i < this.choices.length; ++i) {
				for (var j = i + 1; j < this.choices.length; ++j) {
					this.imaginaryContests.push(new ImaginaryContest(this.rankingMatrix, this.choices[i], this.choices[j]));
				}
			}
		
			dilemma.forEach(function(voteCount, selection) {
				var rankedSets = selection.getRankedSets();
				for (var i = 0; i < rankedSets.length; ++i) {
					for (var j = i + 1; j < rankedSets.length; ++j) {
						this._addPreference(voteCount, rankedSets[i], rankedSets[j]);
					}
				}
			}.bind(this));
		}
		
		Ranking.prototype._addPreference = function(number, preferred, lessPreferred) {
			var rankMatrix = this.rankingMatrix;
			Group.forEach(preferred, function(preferredValue) {
				Group.forEach(lessPreferred, function(lessPreferredValue) {
					rankMatrix.increment(preferredValue, lessPreferredValue, number);
				});
			});
		};
		
		Ranking.prototype.rankedPairs = function() {
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
		
			return group(this.choices, totals).reverse();
		};
		
		module.exports = Ranking;
	});
	
	// Selection.js (modified 18:27:21)
	define('SocialChoice/lib/Selection', function(require, exports, module) {
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
	});
	
	// SelectionFactory.js (modified 18:27:36)
	define('SocialChoice/lib/SelectionFactory', function(require, exports, module) {
		var Selection = require('./Selection');
		
		function SelectionFactory(options) {
			this.selections = {};
			this.options = options;
		}
		SelectionFactory.prototype.getSelection = function() {
			var scores = Array.prototype.slice.call(arguments);
			var id = scores.join(",");
			if (!this.selections[id]) {
				this.selections[id] = new Selection(this.options, id, scores);
			}
			return this.selections[id];
		};
		SelectionFactory.prototype.getById = function(selectionId) {
			return this.selections[selectionId];
		};
		
		module.exports = SelectionFactory;
	});
	
	// Summation.js (modified 18:28:45)
	define('SocialChoice/lib/Summation', function(require, exports, module) {
		var Util = require('./Util');
		var zero = Util.zero, toMap = Util.toMap, group = Util.order;
		var Group = require('./Group');
		
		function Summation(dilemma) {
			this.dilemma = dilemma;
			this.choices = dilemma.choices.slice();
			this._finalScores = this.choices.map(zero);
		
			dilemma.forEach(function(voteCount, selection) {
				for (var i = 0; i < selection.scores.length; ++i) {
					this._finalScores[i] += selection.scores[i] * voteCount;
				}
			}.bind(this));
		
			this._result = group(this.choices, this._finalScores);
			this._winner = this._result[0];
		}
		
		Summation.prototype.scoreCard = function() {
			return toMap(this.choices, this._finalScores);
		};
		Summation.prototype.result = function() {
			return this._result;
		};
		Summation.prototype.winner = function() {
			return this._winner;
		};
		Summation.prototype.plurality = function() {
			var losers = new Group();
			for (var i = 1; i < this._result.length; ++i) {
				losers.addAll(this._result[i]);
			}
			return [this._winner, losers];
		};
		
		
		module.exports = Summation;
	});
	
	// Util.js (modified 18:29:06)
	define('SocialChoice/lib/Util', function(require, exports, module) {
		var Group = require('./Group');
		
		function group(dataArray, scoreArray) {
			var result = [];
			var indexArray = indexSort(scoreArray);
			var currentGroup = Group();
			var currentScore = scoreArray[indexArray[0]];
			for (var i = 0; i < indexArray.length; ++i) {
				if (scoreArray[indexArray[i]] !== currentScore) {
					result.push(currentGroup);
					currentGroup = new Group();
					currentScore = scoreArray[indexArray[i]];
				}
				currentGroup.add(dataArray[indexArray[i]]);
			}
			if (currentGroup.isEmpty() === false) {
				result.push(currentGroup);
			}
			return result;
		}
		exports.order = group;
		
		function range(to) {
			var result = [];
			for (var i = 0; i < to; ++i) {
				result[i] = i;
			}
			return result;
		}
		exports.range = range;
		
		function countOptions(array) {
			var result = 0;
			for (var i = 0; i < array.length; ++i) {
				result += Group.size(array[i]);
			}
			return result;
		}
		exports.countOptions = countOptions;
		
		function zero() {
			return 0;
		}
		exports.zero = zero;
		
		function indexSort(array) {
			var result = range(array.length);
			result.sort(function(a, b) {
				return array[b] - array[a];
			});
			return result;
		}
		exports.indexSort = indexSort;
		
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
		exports.squareArray = squareArray;
		
		function toMap(keys, values) {
			var result = {};
			for (var i = 0; i < keys.length; ++i) {
				result[keys[i]] = values[i];
			}
			return result;
		}
		exports.toMap = toMap;
		
		function notIn(array) {
			var excludedValues = array.slice();
			return function(value) {
				return excludedValues.indexOf(value) < 0;
			};
		}
		exports.notIn = notIn;
	});
	return require('./SocialChoice/lib/Dilemma');
});