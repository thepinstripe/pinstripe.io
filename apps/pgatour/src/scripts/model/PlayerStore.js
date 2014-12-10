/*global DeLorean */

var Action      = require('../app/Action');
var config      = require('../config');

var actions = {};
actions[Action.STATS_LOADED] = 'setStats';

module.exports = new DeLorean.Flux.createStore({

    actions: actions,

    initialize: function () {
        this.data = {};
    },

    setStats: function (data) {
        var ryderCup = config.ryderCup;
        var statIds = config.statIds;

        this.data.players = _
            .chain(data)
            .filter(function (player) {
                return player.stats.length === statIds.length;
            })
            .each(function (player) {
                _.each(_.keys(ryderCup), function (key) {
                    if (ryderCup[key].indexOf(player.bio.name) >= 0) {
                        player.ryderCup = key;
                    }
                });
            })
            .value();

        this.emitChange();
    },

    getState: function () {
        return this.data;
    }

})();