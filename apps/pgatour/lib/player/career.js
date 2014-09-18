var _ = require('lodash');
var util = require('../../../lib/util');
var urls = require('../urls');

module.exports = function(config, done) {
    
    var playerId = config.id;
    var output = config.output || '.';

    console.log('Loading career for player with ID: ' + playerId + '...');

    util.getJSON(urls.playerCareer(playerId), function(json) {
        util.io.saveJSON(output + '/' + playerId + '/career.json', json.plrs[0]);
        
        if (_.isFunction(done)) {
            done();
        }
    });
    
};