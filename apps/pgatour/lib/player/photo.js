var _ = require('lodash');
var util = require('../../../lib/util');

module.exports = function(config, done) {
    
    var playerId = config.id;
    var output = config.output || './data/players';

    console.log('Loading photo for player with ID: ' + playerId + '...');

    var dir = output + '/' + playerId;
    var bio = util.io.loadJSON(dir + '/bio.json');
    
    util.getImage(bio.bio.photo, dir + '/photo.png', function() {
        if (_.isFunction(done)) {
            done();
        }
    });
    
};