/*global _ */

var Dispatcher  = require('./Dispatcher');
var config      = require('../config');

module.exports = {

    loadStats: function () {
        var stats = config.statIds;

        d3.json('/apps/pgatour/players/stats/' + stats.join(','), function (data) {
            Dispatcher.statsLoaded(data);
        });
    }

};