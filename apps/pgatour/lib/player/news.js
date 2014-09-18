var _ = require('lodash');
var util = require('../../../lib/util');
var urls = require('../urls');

module.exports = function(config, done) {
    
    var playerId = config.id;
    var count = config.count || 200;
    var output = config.output || '.';

    console.log('Loading ' + count + ' news items for player with ID: ' + playerId + '...');

    util.getJSON(urls.playerNews(playerId, count), function(json) {
        util.io.saveJSON(output + '/' + playerId + '/news.json', json.items);
        
        if (_.isFunction(done)) {
            done();
        }
    });
    
};