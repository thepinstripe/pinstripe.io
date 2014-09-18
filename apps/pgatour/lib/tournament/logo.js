var _ = require('lodash');
var util = require('../../../lib/util');
var urls = require('../urls');

module.exports = function(config, done) {
    
    var tournamentId = config.id;
    var output = config.output || './data/tournaments';

    console.log('Loading logo for tournament with ID: ' + tournamentId + '...');

    var dir = output + '/' + tournamentId;
    
    util.getImage(urls.tournamentLogo(tournamentId), dir + '/logo.png', function() {
        if (_.isFunction(done)) {
            done();
        }
    });
    
};