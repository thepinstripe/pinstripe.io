var _ = require('lodash');
var util = require('../../../lib/util');
var urls = require('../urls');

module.exports = function(config, done) {
    
    var playerId = config.id;
    var output = config.output || '.';

    console.log('Loading results for player with ID: ' + playerId + '...');

    util.getJSON(urls.playerResults(playerId), function(json) {
        util.io.saveJSON(output + '/' + playerId + '/results.json', json.plrs[0]);
        
        if (_.isFunction(done)) {
            done();
        }
    });
    
};