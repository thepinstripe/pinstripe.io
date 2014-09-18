module.exports = {
    
    root: function() {
        return 'http://www.pgatour.com';
    },
    
    absolute: function(path) {
        return this.root() + path;
    },
    
    leaderboard: function() {
        return this.absolute('/stats/stat.02671.html');
    },
    
    player: function(playerId) {
        return this.absolute('/players/player.' + playerId + '.html');
    },

    playerStats: function(playerId) {
        return this.absolute('/data/players/' + playerId + '/2014stat.json');
    },
    
    playerResults: function(playerId) {
        return this.absolute('/data/players/' + playerId + '/2014results.json');
    },
    
    playerCareer: function(playerId) {
        return this.absolute('/data/players/' + playerId + '/career.json');
    },
    
    playerNews: function(playerId, results) {
        results = results || 200;
        
        var pid = String(playerId);
        
        while (pid.length < 6) {
            pid = '0' + pid;
        }
        
        var newsId = pid[0] + pid[1] + '/' + pid[2] + pid[3] + '/' + pid[4] + pid[5]; // 02/47/81
        
        return this.absolute('/bin/data/feeds/content.articles.json/d=1&lang=LANG_NOT_DEFINED&tags=PGATOUR:Players/' + newsId + '&size=' + results);
    },

    schedule: function() {
        return this.absolute('/tournaments/schedule.html');
    },
    
    tournament: function(tournamentId) {
        return this.absolute('/data/r/' + tournamentId + '/setup.json');
    },
    
    tournamentPlayerStats: function(tournamentId) {
        return this.absolute('/data/r/' + tournamentId + '/player_stats.json');
    },
    
    tournamentLogo: function(tournamentId) {
        return this.absolute('/content/dam/pgatour/logos/tournament_logos/r' + tournamentId + '/220x75.png');
    },
    
    tournamentScorecard: function(tournamentId, playerId) {
        return this.absolute('/data/r/' + tournamentId + '/scorecards/' + playerId + '.json');
    }
    
};