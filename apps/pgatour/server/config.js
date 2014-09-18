var nconf = require('nconf');
var path = require('path');
var basePath = __dirname + '/..';

nconf.use('memory');

var config = {
    basePath: basePath,
    playersDataPath: path.join(basePath, 'data', 'players'),
    tournamentsDataPath: path.join(basePath, 'data', 'tournaments')
};

Object.keys(config).forEach(function(key) {
    nconf.set(key, config[key]);
});
