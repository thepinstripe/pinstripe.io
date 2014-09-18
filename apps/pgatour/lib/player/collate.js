var _ = require('lodash');
var async = require('async');
var fs = require('fs');
var util = require('../../../lib/util');

var PLAYERS_DIR = './data/players';
var TOURNAMENTS_DIR = './data/tournaments';
var PGA_TOUR = 'PGA TOUR';

var MongoClient = require('mongodb').MongoClient;

var playerIndex = {};

module.exports = function() {
    
    var playerIds = fs.readdirSync(PLAYERS_DIR).filter(isDir(PLAYERS_DIR));
    var tournamentIds = fs.readdirSync(TOURNAMENTS_DIR).filter(isDir(TOURNAMENTS_DIR));
    var players = [];
    var news = [];
    var newsIndex = {};
    var results = [];
    var tournaments = [];
    var playerStats = [];
    
    _.each(playerIds, function(playerId) {
        var data = getPlayer(playerId);
        
        players.push(data.player);
        playerIndex[data.player.id] = data;
        
        results = results.concat(data.results);
        
        _.each(data.news, function(item) {
            var existingItem = newsIndex[item.id];
            
            if (existingItem) {
                existingItem.playerIds = existingItem.playerIds.concat(item.playerIds);
            } else {
                news.push(item);
                newsIndex[item.id] = item;
            }
        });
    });
    
    _.each(tournamentIds, function(tournamentId) {
        var data = getTournament(tournamentId);

        tournaments.push(data.tournament);
        playerStats = playerStats.concat(data.playerStats);
    });
    
    var importData = {
        /*players: players,
        tournaments: tournaments,
        news: news,
        results: results,*/
        playerTournamentStats: playerStats
    };

    MongoClient.connect('mongodb://127.0.0.1:27017/pgatour', function(err, db) {
        if (err) throw err;
        
        async.series(Object.keys(importData).map(function(key) {
            return function(done) {
                var data = importData[key];
                
                console.log('Importing ' + data.length + ' ' + key + '...');
                
                db.createCollection(key, function(err, collection) {
                    if (err) throw err;

                    async.forEachSeries(data, function(item, done) {
                        collection.insert(item, done);
                    }, done);
                });
            };
        }), function() {
            db.close();
            console.log('All done.');
        });
    });
    
};

function getPlayer(playerId) {
    
    var dir = PLAYERS_DIR + '/' + playerId;
    var data = util.io.loadJSONDirAsObject(dir);

    //--------------------------------------
    //  Player data
    //--------------------------------------

    var player = data.bio;
    player.id = data.career.plrNum;

    //--------------------------------------
    //  Career
    //--------------------------------------

    player.career = _
        .chain(data.career.tours)
        .where({ tourDesc: PGA_TOUR })
        .first()
        .value();

    //--------------------------------------
    //  News
    //--------------------------------------

    var news = _
        .chain(data.news)
        .map(function(item) {
            return _.pick(item, ['id', 'title', 'link', 'image']);
        })
        .each(function(item) {
            if (!item.playerIds) {
                item.playerIds = [];
            }
            item.playerIds.push(player.id);
        })
        .value();

    //--------------------------------------
    //  Results
    //--------------------------------------

    var results = _
        .chain(data.results.tours)
        .where({ tourDesc: PGA_TOUR })
        .pluck('trnDetails')
        .flatten()
        .each(function(t) {
            t.tournamentId = t.trn.permNum;
            t.playerId = player.id;
        })
        .value();

    //--------------------------------------
    //  Stats
    //--------------------------------------

    var statCats = _
        .chain(data.stats.years[0].tours)
        .where({ tourName: PGA_TOUR })
        .value()
        .shift()
        .statCats;

    player.stats = _
        .chain(statCats)
        .map(function(statCat) {
            return _.map(statCat.stats, function(stat) {
                stat.statCat = statCat.catName;
                return stat;
            });
        })
        .flatten()
        .value();

    return {
        player: player,
        news: news,
        results: results
    };
}

function getTournament(tournamentId) {
    
    var dir = TOURNAMENTS_DIR + '/' + tournamentId;
    var data = util.io.loadJSONDirAsObject(dir);
    
    //--------------------------------------
    //  Tournament info
    //--------------------------------------
    
    var course = data.info.rnds[0].courses[0];
    
    var tournament = _.extend(data.info.event, {
        id: data.info.event.permNum,
        course: _.extend(course, _.where(data.info.courseInfos, { id: course.id })[0])
    });
    
    tournament.date = new Date(
        _.parseInt(data.info.updated.dateYYYY),
        _.parseInt(data.info.updated.dateMM) - 1,
        _.parseInt(data.info.updated.dateDD)
    );
    
    //--------------------------------------
    //  Player stats
    //--------------------------------------
    
    var playerStats = _
        .chain(data.playerstats.players)
        .each(function(stat) {
            stat.playerId = stat.pid;
            delete stat.pid;
            
            var playerData = playerIndex[stat.playerId];
            
            stat.tournament = {
                id: tournamentId,
                name: tournament.name,
                date: tournament.date
            };
            
            if (playerData) {
                stat.result = _.find(playerData.results, {
                    tournamentId: tournament.id
                });
            }
        })
        .value();
    
    return {
        playerStats: playerStats,
        tournament: tournament
    };
    
}

function isDir(base) {
    return function(file) {
        return fs.statSync(base + '/' + file).isDirectory();
    };
}