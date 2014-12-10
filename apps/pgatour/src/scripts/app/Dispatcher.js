/*global DeLorean,_ */

var Action = require('./Action');
var PlayerStore = require('../model/PlayerStore');

var playerStore = new PlayerStore();

module.exports = DeLorean.Flux.createDispatcher({

    statsLoaded: function (data) {
        this.dispatch(Action.STATS_LOADED, data);
    },

    getStores: function () {
        return {
            players: playerStore
        };
    }

});
