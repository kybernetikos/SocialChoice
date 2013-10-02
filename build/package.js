var path = require('path');
var fs = require('fs');
var Browserify = require('browserify');

var bundle = Browserify();
bundle.add('..');
bundle.bundle({
	standalone: "SocialChoice"
}).pipe(fs.createWriteStream(path.join(__dirname, "..", "target", "SocialChoice.js")));