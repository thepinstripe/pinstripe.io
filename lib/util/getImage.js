var _ = require('lodash');
var request = require('request');
var fs = require('fs');

module.exports = function(url, pathToFile, done) {
    request(url, function() {
        if (_.isFunction(done)) {
            return done(null);
        }
    }).pipe(fs.createWriteStream(pathToFile));
};
