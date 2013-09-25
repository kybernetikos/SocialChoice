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