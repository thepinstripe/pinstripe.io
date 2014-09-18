var _ = require('lodash');
var async = require('async');
var util = require('../../lib/util');
var urls = require('./urls');

var leaderboard = require('./leaderboard');
var player = require('./player');

module.exports = function(config, done) {

    async.waterfall([
        function(done) {
            leaderboard(null, done);
        },
        function(players, done) {
            async.forEachSeries(_.pluck(players, 'id'), function(id, done) {
                player({ id: id }, done);
            }, done);
        }
    ], function() {
        console.log('All done.');
        
        if (_.isFunction(done)) {
            done();
        }
    });

};