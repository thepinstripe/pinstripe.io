var _ = require('lodash');
var async = require('async');
var fs = require('fs');
var util = require('../../lib/util');

var TOURNAMENTS_DIR = './data/tournaments';

var MongoClient = require('mongodb').MongoClient;

module.exports = function() {

    MongoClient.connect('mongodb://127.0.0.1:27017/pgatour', function(err, db) {
        if (err) throw err;
        
        async.series([
            //fixNews(db),
            fixTournaments(db)
        ], function() {
            db.close();
            console.log('All done.');
        });
    });
    
};

function fixTournaments(db) {
    return function(done1) {
        console.log('Fixing tournaments...');
        
        db.collection('tournaments', function(err, collection) {
            collection.find().toArray(function(err, tournaments) {
                console.log('Fixing ' + tournaments.length + ' tournaments...');
                
                async.eachSeries(tournaments, function(tournament, done2) {
                    console.log('Fixing tournament "' + tournament.name + '"...');

                    var id = tournament.id;
                    var json = util.io.loadJSON(TOURNAMENTS_DIR + '/' + id + '/info.json');
                    var date = new Date(_.parseInt(json.updated.dateYYYY), _.parseInt(json.updated.dateMM) - 1, _.parseInt(json.updated.dateDD));

                    console.log('Date: ' + date);

                    tournament.date = date;

                    collection.update({ id: id }, tournament, function() {
                        console.log('Fixing player tournament stats...');

                        db.collection('playerTournamentStats', function(err, collection) {
                            collection.find({ 'tournament.id': id }).toArray(function(err, stats) {
                                var count = 0;
                                console.log('Fixing ' + stats.length + ' player tournament stats...');
                                
                                async.eachSeries(stats, function(stat, done3) {
                                    stat.tournament.date = date;
                                    collection.update({ id: stat.id }, { tournament: stat.tournament }, function() {
                                        count++;
                                        done3();
                                    });
                                }, function() {
                                    console.log('Fixed ' + count + ' player tournament stats.');
                                    done2();
                                });
                            });
                        });
                    });
                }, function() {
                    console.log('done1');
                    done1();
                });
            });
        });
    };
}

function fixNews(db) {
    return function(done) {
        console.log('Fixing news...');
        
        db.collection('news', function (err, collection) {
            collection.find().toArray(function(err, news) {
                console.log('Fixing ' + news.length + ' items...');
                
                async.eachSeries(news, fixNewsItem(collection), done);
            });
        });
    }
}

function fixNewsItem(collection) {
    return function(item, done) {
        // http://www.pgatour.com/news/2014/07/15/david-hearn-mark-calcavecchia-open-championship.html
        var dateParts = item.link.split('/');
        var date = new Date(_.parseInt(dateParts[4]), _.parseInt(dateParts[5]) - 1, _.parseInt(dateParts[6]));

        item.date = date;

        collection.update({ id: item.id }, item, done);
    };
}