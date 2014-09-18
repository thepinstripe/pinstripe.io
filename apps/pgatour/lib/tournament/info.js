var _       = require('lodash');
var util    = require('../../../lib/util/index');
var urls    = require('./../urls');

module.exports = function(config, done) {

    var tournamentId = config.id;
    var output = config.output || '.';

    console.log('Loading tournament info with ID: ' + tournamentId + '...');

    util.getJSON(urls.tournament(tournamentId), function(json) {
        if (json) {
            util.io.saveJSON(output + '/' + tournamentId + '/info.json', json.trn);
        }

        if (_.isFunction(done)) {
            done();
        }
    });

};
