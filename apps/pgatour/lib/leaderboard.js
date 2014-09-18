var _ = require('lodash');

var util = require('../../lib/util');
var urls = require('./urls');

var HEADER_MAPPINGS = {
    'id':                   'id',
    'RANK THIS WEEK':       'rankThisWeek',
    'RANK LAST WEEK':       'rankLastWeek',
    'PLAYER NAME':          'name',
    'EVENTS':               'events',
    'POINTS':               'points',
    '# OF WINS':            'wins',
    '# OF TOP 10\'S':       'top10s'
};

var NUMERIC_FIELDS = [
    'rankThisWeek',
    'rankLastWeek',
    'events',
    'points',
    'wins',
    'top10s'
];

module.exports = function(config, done) {
    
    util.get(urls.leaderboard(), function($) {
        var $table = $('#statsTable');
        var players = util.selection.parseTable($table, function($row) {
            var id = String(_.parseInt($row.attr('id').replace('playerStatsRow', '')));
            while (id.length < 5) {
                id = '0' + id;
            }
            return id;
        });
        
        players = players
            .map(util.data.mapKeys(HEADER_MAPPINGS))
            .map(function(player) {
                NUMERIC_FIELDS.forEach(function(field) {
                    player[field] = parseNumber(player[field]);
                });
                
                return player;
            });
        
        util.io.saveJSON('./data/leaderboard.json', players);
        
        if (_.isFunction(done)) {
            return done(null, players);
        }
    });
    
};

function parseNumber(num) {
    return _.parseInt(String(num).split(',').join(''));
}
