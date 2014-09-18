var MongoClient = require('mongodb').MongoClient;

var COLLECTIONS = ['players', 'tournaments', 'news', 'results', 'playerTournamentStats'];

MongoClient.connect('mongodb://127.0.0.1:27017/pgatour', function(err, db) {
    if (err) throw err;
    
    console.log('Connected to database.');
    
    module.exports.db = db;

    COLLECTIONS.forEach(function(key) {
        db.collection(key, function(err, collection) {
            console.log('Loaded ' + key + ' collection.');
            db[key] = collection;
        });
    });
});

module.exports = {
    get: function(collection) {
        return this.db[collection];
    }
};