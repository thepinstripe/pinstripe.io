var _       = require('lodash');
var util    = require('../../../lib/util/index');
var urls    = require('./../urls');

module.exports = function(config, done) {

    var tournamentId = config.id;
    var output = config.output || '.';

    console.log('Loading tournament player stats with ID: ' + tournamentId + '...');

    util.getJSON(urls.tournamentPlayerStats(tournamentId), function(json) {
        if (json) {
            util.io.saveJSON(output + '/' + tournamentId + '/playerstats.json', json.tournament);
        }

        if (_.isFunction(done)) {
            done();
        }
    });
    
};
