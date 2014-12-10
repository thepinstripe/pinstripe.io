/*global d3,_,DeLorean*/

/** @jsx React.DOM */

var config              = require('../config');
var ScatterGraph        = require('./graph/ScatterGraph');
var DataAspect          = require('./graph/aspect/DataAspect');
var PlayerStatAccessor  = require('../model/PlayerStatAccessor');

var ryderCup = config.ryderCup;

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

var DrivingStatsView = React.createClass({

    getInitialState: function () {
        return {
            mode: 'tendency',
            modes: [
                { mode: 'accuracy', label: 'Driving Accuracy' },
                { mode: 'tendency', label: 'Driving Tendency' }
            ]
        };
    },

    render: function () {
        return (
            <section className="content">
                <h2>PGA Tour Driving Stats, 2014</h2>
                <article className="graph">
                    { this.renderActions() }
                </article>
                <div ref="container"></div>
            </section>
        );
    },

    renderActions: function () {
        return (
            <div id="actions" className="hlist pull--right">
                { this.state.modes.map(this.renderAction) }
            </div>
        );
    },

    renderAction: function (config) {
        return (
            <ActionButton
                key={ config.mode }
                mode={ config.mode }
                label={ config.label }
                selected={ config.mode === this.state.mode }
                onClick={ this.switchMode }
                />
        );
    },

    componentDidMount: function () {
        this.componentDidUpdate();
    },

    componentDidUpdate: function () {
        if (!this.view) {
            this.createView();
        }

        if (this.props.data) {
            this.view.render(this.props.data, configs[this.state.mode]);
        }
    },

    createView: function () {
        var el = this.refs.container.getDOMNode();

        this.view = ScatterGraph({
            el: el,
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
                var clubHeadSpeed   = PlayerStatAccessor.clubHeadSpeed(player);
                var drivingAccuracy = PlayerStatAccessor.drivingAccuracy(player);
                var leftTendency    = PlayerStatAccessor.leftTendency(player);
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
    },

    switchMode: function (mode) {
        this.setState({
            mode: mode
        });
    }

});

var ActionButton = React.createClass({

    render: function () {
        var classSet = React.addons.classSet({
            'hlist__item': true,
            'toggle': true,
            'is-selected': this.props.selected
        });

        return (
            <button
                className={ classSet }
                onClick={ this.onToggleClick }
                >
                { this.props.label }
            </button>
        );
    },

    onToggleClick: function () {
        this.props.onClick(this.props.mode);
    }

});

module.exports = DrivingStatsView;
