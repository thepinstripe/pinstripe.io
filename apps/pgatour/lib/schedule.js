var _       = require('lodash');
var async   = require('async');
var fs      = require('fs');
var util    = require('../../lib/util/index');
var urls    = require('./urls');

var tournament = require('./tournament');

var TOURNAMENTS_DIR = './data/tournaments';
var PLAYERS_DIR = './data/players';

module.exports = function(config, done) {

    var tournamentId = String(config.id);

    while (tournamentId.length < 3) {
        tournamentId = '0' + tournamentId;
    }

    config.id = tournamentId;
    config.output = config.output || TOURNAMENTS_DIR;
    
    var tournamentIds = _
        .chain(fs.readdirSync(PLAYERS_DIR))
        .filter(function(dir) {
            return dir.charAt(0) !== '.';
        })
        .map(function(dir) {
            return util.io.loadJSON(PLAYERS_DIR + '/' + dir + '/results.json');
        })
        .map(function(results) {
            return _.map(results.tours, _.property('trnDetails'));
        })
        .flatten()
        .pluck('trn')
        .pluck('permNum')
        .unique()
        .value();
    
    async.forEachSeries(tournamentIds, function(tournamentId, done) {
        tournament({ id: tournamentId }, done);
    }, function(err) {
        if (err) {
            return done(err);
        }
        
        return done();
    });

};
