var _ = require('lodash');
var util = require('../../../lib/util');
var urls = require('../urls');

module.exports = function(config, done) {
    
    var playerId = config.id;
    var output = config.output || '.';

    console.log('Loading stats for player with ID: ' + playerId + '...');

    util.getJSON(urls.playerStats(playerId), function(json) {
        util.io.saveJSON(output + '/' + playerId + '/stats.json', json.plrs[0]);
        
        if (_.isFunction(done)) {
            done();
        }
    });
    
};