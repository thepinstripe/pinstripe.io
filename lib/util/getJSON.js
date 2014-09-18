var request = require('request');

module.exports = function(url, done) {
    request(url, function(err, res) {
        if (err) {
            throw err;
        }
        
        try {
            done(JSON.parse(res.body));
        } catch (e) {
            done(undefined);
        }
    });
};