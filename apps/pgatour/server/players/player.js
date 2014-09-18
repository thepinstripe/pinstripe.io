var _       = require('lodash');
var db      = require('../db');

function collection() {
    return db.get('players');
}

function getPlayerById(id) {
    var args = _.toArray(arguments);
    args[0] = { id: id };

    collection().findOne.apply(collection(), args);
}

function getPlayerTournamentStatsById(id, done) {
    db.get('playerTournamentStats').find({
        playerId: id
    }).toArray(done);
}

function getPlayerNewsById(id, done) {
    db.get('news').find({
        playerIds: id
    }).toArray(done);
}

function getPlayers(fields, done) {
    collection().find({}, fields).toArray(done);
}

function getStatsForAllPlayers(statIds, done) {
    collection().find({}, ['id', 'bio', 'stats']).toArray(function(err, players) {
        if (err) return done(err);
        
        var stats = _
            .chain(players)
            .each(function(player) {
                player.stats = _
                    .chain(player.stats)
                    .filter(function(stat) {
                        return statIds.indexOf(stat.statID) >= 0;
                    })
                    .value();
            })
            .value();
        
        done(null, stats);
    });
}

module.exports = {
    getPlayerById: getPlayerById,
    getPlayerTournamentStatsById: getPlayerTournamentStatsById,
    getPlayerNewsById: getPlayerNewsById,
    getPlayers: getPlayers,
    getStatsForAllPlayers: getStatsForAllPlayers
};