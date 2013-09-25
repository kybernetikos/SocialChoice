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