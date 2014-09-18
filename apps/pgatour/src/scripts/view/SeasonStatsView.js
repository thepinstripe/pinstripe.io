/*global d3,_ */

var LineGraph = require('./graph/LineGraph');
var PlayerStatAccessor = require('../model/PlayerStatAccessor');

function SeasonStatsView (options) {

    var news;
    var tournamentStats;
    var $el = d3.select(options.el);
    
    var statsOfInterest = [
        'Driving Distance Avg',
        'Fairways Hit'
    ];
    
    var statsView = LineGraph({
        id: _.property('id'),
        el: $el.append('g'),
        width: 1024,
        height: 700,
        dataAspects: {
            x: {
                scale: d3.time.scale(),
                value: function(d) {
                    return d.tournament.date;
                }
            },
            y: _.map(statsOfInterest, function(stat) {
                return {
                    value: PlayerStatAccessor.accessor(stat)
                };
            })
        }
    });
    
    var newsView = LineGraph({
        el: $el.append('g')
    });
    
    function render() {
        statsView.render();
    }
    
    d3.json('/players/24781/news', function (data) {
        news = data;
        
        newsView.render();
    });
    
    d3.json('/players/24781/tournaments/stats', function (data) {
        tournamentStats = data;

        render();
    });
    
    return {
        render: render
    };
}

module.exports = SeasonStatsView;