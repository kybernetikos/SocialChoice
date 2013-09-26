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