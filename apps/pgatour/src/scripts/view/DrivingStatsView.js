/*global d3,_*/

var config              = require('../config');
var ScatterGraph        = require('./graph/ScatterGraph');
var DataAspect          = require('./graph/aspect/DataAspect');
var PlayerStatAccessor  = require('../model/PlayerStatAccessor');

var stats = '101,102,02422,02423,02401'.split(',');
var ryderCup = config.ryderCup;

function DrivingStatsView (options) {
    
    var players;
    
    var configs = {
        tendency: {
            // Just defaults
        },
        accuracy: {
            dataAspects: {
                a: {
                    value: function (player) {
                        return 0.5;
                    },
                    scale: d3.scale.linear().range([0.1, 0.5])
                },
                y: {
                    value: function (player) {
                        var value = (100 - PlayerStatAccessor.drivingAccuracy(player)) / 2;
                        var leftTendency = PlayerStatAccessor.leftTendency(player);
                        var isLeft = leftTendency > 50;

                        return isLeft ? -value : value;
                    },
                    scale: d3.scale.pow().exponent(1.5)
                }
            }
        }
    };

    var view = ScatterGraph({
        el: options.el,
        id: _.property('id'),
        width: 1024,
        height: 700,
        sort: 'r',
        dataAspects: {
            x: PlayerStatAccessor.drivingDistance,
            y: {
                value: PlayerStatAccessor.tendency,
                align: DataAspect.CENTRE
            },
            r: {
                value: PlayerStatAccessor.drivingAccuracy,
                scale: d3.scale.linear().range([12, 4])
            },
            a: {
                value: PlayerStatAccessor.clubHeadSpeed,
                scale: d3.scale.linear().range([0.1, 0.5])
            }
        },
        tipLabel: function (player) {
            var drivingDistance = PlayerStatAccessor.drivingDistance(player);
            var clubHeadSpeed = PlayerStatAccessor.clubHeadSpeed(player);
            var drivingAccuracy = PlayerStatAccessor.drivingAccuracy(player);
            var leftTendency = PlayerStatAccessor.leftTendency(player);
            var tendency;

            if (leftTendency < 50) tendency = 'right';
            if (leftTendency > 50) tendency = 'left';

            // 208 * 276
            return (
                '<div style="width: 230px">' +
                    '<img src="' + player.bio.photo + '" style="float: left; width: 50px; height: 66px; margin-right: 10px; border-radius: 2px">' +
                    '<strong class="peppermint">' + player.bio.name + '</strong><br>' +
                    drivingDistance + ' yards' +
                    (tendency ? ', ' + (tendency === 'left' ? leftTendency : (100 - leftTendency)) + '% ' + tendency + ' tendency' : '') +
                    '<br>' +
                    'Driving accuracy: ' + drivingAccuracy + '%<br>' +
                    'Club head speed: ' + clubHeadSpeed +
                '</div>'
            );
        }
    });

    var $buttons = d3.selectAll('#actions button');

    function render(config) {
        view.render(players, configs[config]);

        $buttons.classed('is-selected', function () {
            return d3.select(this).attr('data-config') === config;
        });
    }

    $buttons.on('click', function () {
        var config = d3.select(this).attr('data-config');

        console.log('Switch config', config);

        render(config);
    });

    d3.json('/players/stats/' + stats.join(','), function (data) {
        players = _
            .chain(data)
            .filter(function (player) {
                return player.stats.length === stats.length;
            })
            .each(function (player) {
                _.each(_.keys(ryderCup), function (key) {
                    if (ryderCup[key].indexOf(player.bio.name) >= 0) {
                        player.ryderCup = key;
                    }
                });
            })
            .value();
        
        render('tendency');
    });
    
    return {
        render: render
    };
}

module.exports = DrivingStatsView;
