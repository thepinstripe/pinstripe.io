var _       = require('lodash');
var async   = require('async');
var util    = require('../../../lib/util/index');
var urls    = require('./../urls');

var info        = require('./info');
var stats       = require('./playerstats');
var logo        = require('./logo');

var TOURNAMENTS_DIR = './data/tournaments';

module.exports = function(config, done) {

    var tournamentId = String(config.id);
    
    while (tournamentId.length < 3) {
        tournamentId = '0' + tournamentId;
    }
    
    config.id = tournamentId;
    config.output = config.output || TOURNAMENTS_DIR;

    console.log('Loading tournament with ID: ' + tournamentId + '...');

    async.series([info, stats, logo].map(function(fn) {
        return function (done) {
            fn(config, done);
        };
    }), function() {
        // Ignore errors, some tournaments won't exist.
        done(null);
    });

};
