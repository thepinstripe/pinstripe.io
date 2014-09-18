var cheerio = require('cheerio');
var request = require('request');

module.exports = function(url, done) {
    request(url, function(err, res) {
        if (err) {
            throw err;
        }
        done(cheerio.load(res.body));
    });
};