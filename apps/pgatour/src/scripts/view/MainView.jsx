/** @jsx React.DOM */

var Flux = DeLorean.Flux;
var DrivingStatsView = require('./DrivingStatsView.jsx');

module.exports = React.createClass({

    mixins: [Flux.mixins.storeListener],

    render: function () {
        var data = this.getStore('players').players;

        return (
            <DrivingStatsView data={ data } />
        );
    }

});