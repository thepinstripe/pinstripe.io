/** @jsx React.DOM */

module.exports = React.createClass({

    props: {
        dataPoints: React.dataTypes.array
    },

    getDefaultProps: function () {
        return {
            dataPoints: []
        };
    },

    getInitialState: function () {
        return {
            line: d3.svg.line()
                .x(_.property('x'))
                .y(_.property('y'))
        };
    },

    render: function () {
        var d = this.calculatePath();

        return (
            <g>
                <path d={ d } />
                { this.renderPoints() }
            </g>
        );
    },

    renderPoints: function () {
        return this.props.dataPoints.map(this.renderPoint);
    },

    renderPoint: function (dataPoint, index) {
        var key = dataPoint.id || index;

        return (
            <DataPoint
                key={ key }
                x={ dataPoint.x }
                y={ dataPoint.y }
                onMouseOver={ this.handleDataPointMouseOver }
                onMouseOut={ this.handleDataPointMouseOut }
                />
        );
    },

    calculatePath: function () {
        return this.state.line(this.props.dataPoints);
    },

    handleDataPointMouseOver: function (dataPoint) {

    },

    handleDataPointMouseOut: function (dataPoint) {

    }

});

var DataPoint = React.createClass({

    getDefaultProps: function () {
        return {
            x: 0,
            y: 0,
            data: undefined,
            onMouseOver: noop,
            onMouseOut: noop
        };
    },

    render: function () {
        return (
            <circle
                cx={ this.props.x }
                cy={ this.props.y }
                className="line-layer__data-point"
                onMouseOver={ this.handleMouseOver }
                onMouseOut={ this.handleMouseOut }
                />
        );
    },

    handleMouseOver: function () {
        this.props.onMouseOver(this.props.data);
    },

    handleMouseOut: function () {
        this.props.onMouseOut(this.props.data);
    }

});

function noop() {}
